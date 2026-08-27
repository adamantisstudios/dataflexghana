import 'dart:async';

import 'package:flutter/material.dart';

import '../../services/admin_api.dart';
import '../../theme.dart';
import '../../widgets/ops_widgets.dart';
import 'notification_models.dart';

/// Full-height compose/edit sheet for an `agent_notifications` row.
///
/// Returns `true` when the row was saved so the caller can refresh.
Future<bool> showComposeSheet(
  BuildContext context, {
  AgentNotification? editing,
  List<AgentNotification> templateSource = const [],
}) async {
  final saved = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    backgroundColor: OpsColors.cardAlt,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (_) => _ComposeSheet(editing: editing, templateSource: templateSource),
  );
  return saved == true;
}

class _ComposeSheet extends StatefulWidget {
  const _ComposeSheet({required this.editing, required this.templateSource});

  final AgentNotification? editing;
  final List<AgentNotification> templateSource;

  @override
  State<_ComposeSheet> createState() => _ComposeSheetState();
}

class _ComposeSheetState extends State<_ComposeSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _messageCtrl = TextEditingController();
  final _templateCtrl = TextEditingController();
  final _agentSearchCtrl = TextEditingController();

  late DateTime _start;
  late DateTime _end;
  String _frequency = 'once_per_day';
  bool _isActive = true;

  AgentRef? _targetAgent;
  List<AgentRef> _agentResults = const [];
  bool _searchingAgents = false;
  String? _agentSearchError;
  Timer? _searchDebounce;

  bool _saving = false;
  String? _submitError;

  bool get _isEditing => widget.editing != null;

  @override
  void initState() {
    super.initState();
    final row = widget.editing;
    final now = DateTime.now();
    if (row != null) {
      _titleCtrl.text = row.title;
      _messageCtrl.text = row.message;
      _templateCtrl.text = row.templateName ?? '';
      _frequency = kFrequencyOptions.containsKey(row.frequency) ? row.frequency : 'once_per_day';
      _isActive = row.isActive;
      _start = row.startDate?.toLocal() ?? now;
      _end = row.endDate?.toLocal() ?? now.add(const Duration(days: 7));
      if (!row.isBroadcast) {
        _targetAgent = AgentRef(id: row.targetAgentId!, name: shortId(row.targetAgentId));
        unawaited(_hydrateTargetAgent(row.targetAgentId!));
      }
    } else {
      _start = now;
      _end = now.add(const Duration(days: 7));
    }
    _titleCtrl.addListener(_refreshPreview);
    _messageCtrl.addListener(_refreshPreview);
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _titleCtrl.dispose();
    _messageCtrl.dispose();
    _templateCtrl.dispose();
    _agentSearchCtrl.dispose();
    super.dispose();
  }

  void _refreshPreview() {
    if (!mounted) return;
    setState(() {});
  }

  Future<void> _hydrateTargetAgent(String id) async {
    try {
      final rows = await AdminApi.instance.getList(
        kAdminAgentsListPath,
        query: {'id': id},
        keys: const ['agents'],
      );
      if (!mounted || rows.isEmpty) return;
      setState(() => _targetAgent = AgentRef.fromJson(rows.first));
    } catch (_) {
      // Keep the short-id placeholder; the target is still saved correctly.
    }
  }

  void _onAgentQueryChanged(String value) {
    _searchDebounce?.cancel();
    final query = value.trim();
    if (query.length < kAgentSearchMinChars) {
      setState(() {
        _agentResults = const [];
        _searchingAgents = false;
        _agentSearchError = null;
      });
      return;
    }
    _searchDebounce = Timer(const Duration(milliseconds: 350), () => _searchAgents(query));
  }

  Future<void> _searchAgents(String query) async {
    setState(() {
      _searchingAgents = true;
      _agentSearchError = null;
    });
    try {
      final rows = await AdminApi.instance.getList(
        kAdminAgentsListPath,
        query: {'search': query, 'limit': 20},
        keys: const ['agents'],
      );
      if (!mounted) return;
      setState(() {
        _agentResults = rows.map(AgentRef.fromJson).where((a) => a.id.isNotEmpty).toList();
        _searchingAgents = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _searchingAgents = false;
        _agentSearchError = describeNotificationError(e);
      });
    }
  }

  Future<void> _pickDateTime({required bool isStart}) async {
    final current = isStart ? _start : _end;
    final date = await showDatePicker(
      context: context,
      initialDate: current,
      firstDate: DateTime.now().subtract(const Duration(days: 365)),
      lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(current),
    );
    if (!mounted) return;
    final picked = DateTime(
      date.year,
      date.month,
      date.day,
      time?.hour ?? current.hour,
      time?.minute ?? current.minute,
    );
    setState(() {
      if (isStart) {
        _start = picked;
        if (!_end.isAfter(_start)) _end = _start.add(const Duration(days: 7));
      } else {
        _end = picked;
      }
    });
  }

  void _applyTemplate(String name) {
    AgentNotification? source;
    for (final row in widget.templateSource) {
      if (row.templateName == name) {
        source = row;
        break;
      }
    }
    if (source == null) return;
    setState(() {
      _titleCtrl.text = source!.title;
      _messageCtrl.text = source.message;
      _frequency = kFrequencyOptions.containsKey(source.frequency) ? source.frequency : _frequency;
      _templateCtrl.text = name;
    });
  }

  List<String> get _templates {
    final names = <String>{};
    for (final row in widget.templateSource) {
      final n = row.templateName;
      if (n != null && n.isNotEmpty) names.add(n);
    }
    return names.toList()..sort();
  }

  Future<void> _submit() async {
    if (_saving) return;
    FocusScope.of(context).unfocus();
    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (!_end.isAfter(_start)) {
      setState(() => _submitError = 'The end date must be after the start date.');
      return;
    }

    final broadcast = _targetAgent == null;
    if (broadcast && _isActive) {
      final ok = await confirmNotifAction(
        context,
        title: 'Send to every agent?',
        message:
            'This notification will slide down on every agent\'s dashboard between '
            '${formatDateTime(_start.toIso8601String())} and ${formatDateTime(_end.toIso8601String())}. '
            'Broadcasts are hard to take back once agents have seen them.',
        confirmLabel: _isEditing ? 'Save broadcast' : 'Send broadcast',
      );
      if (!ok || !mounted) return;
    }

    setState(() {
      _saving = true;
      _submitError = null;
    });

    final payload = <String, dynamic>{
      'title': _titleCtrl.text.trim(),
      'message': _messageCtrl.text.trim(),
      'start_date': _start.toUtc().toIso8601String(),
      'end_date': _end.toUtc().toIso8601String(),
      'frequency': _frequency,
      'template_name': _templateCtrl.text.trim().isEmpty ? null : _templateCtrl.text.trim(),
      'is_active': _isActive,
      'target_agent_id': _targetAgent?.id,
    };

    try {
      if (_isEditing) {
        await AdminApi.instance.put(
          kAgentNotificationsPath,
          body: {'id': widget.editing!.id, ...payload},
        );
      } else {
        await AdminApi.instance.post(kAgentNotificationsPath, body: payload);
      }
      if (!mounted) return;
      Navigator.pop(context, true);
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _submitError = describeNotificationError(e);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Padding(
      padding: EdgeInsets.only(bottom: bottomInset),
      child: Column(
        mainAxisSize: MainAxisSize.max,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 10),
          Center(
            child: Container(
              width: 42,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(4),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 14, 12, 10),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isEditing ? 'Edit notification' : 'New notification',
                        style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 3),
                      const Text(
                        'Pushed to the agent dashboard as a slide-down message.',
                        style: TextStyle(color: Colors.white54, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: _saving ? null : () => Navigator.pop(context, false),
                  icon: const Icon(Icons.close),
                  tooltip: 'Close',
                ),
              ],
            ),
          ),
          const Divider(height: 1, color: OpsColors.border),
          Expanded(
            child: Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                children: [
                  _previewSection(),
                  const SizedBox(height: 20),
                  if (!_isEditing && _templates.isNotEmpty) ...[
                    _label('Load from template'),
                    DropdownButtonFormField<String>(
                      initialValue: null,
                      isExpanded: true,
                      decoration: _fieldDecoration('Choose a saved template…'),
                      dropdownColor: OpsColors.card,
                      items: [
                        for (final t in _templates)
                          DropdownMenuItem(
                            value: t,
                            child: Text(t, overflow: TextOverflow.ellipsis),
                          ),
                      ],
                      onChanged: _saving ? null : (v) => v == null ? null : _applyTemplate(v),
                    ),
                    const SizedBox(height: 16),
                  ],
                  _label('Title *'),
                  TextFormField(
                    controller: _titleCtrl,
                    enabled: !_saving,
                    textCapitalization: TextCapitalization.sentences,
                    maxLength: 120,
                    decoration: _fieldDecoration('e.g. New MTN bundle prices'),
                    validator: (v) =>
                        (v ?? '').trim().isEmpty ? 'A title is required.' : null,
                  ),
                  const SizedBox(height: 8),
                  _label('Message *'),
                  TextFormField(
                    controller: _messageCtrl,
                    enabled: !_saving,
                    minLines: 4,
                    maxLines: 8,
                    textCapitalization: TextCapitalization.sentences,
                    decoration: _fieldDecoration(
                      'Any link you paste becomes tappable in the agent app.',
                    ),
                    validator: (v) =>
                        (v ?? '').trim().isEmpty ? 'A message is required.' : null,
                  ),
                  const SizedBox(height: 16),
                  _label('Audience'),
                  _audienceSection(),
                  const SizedBox(height: 16),
                  _label('Schedule'),
                  Row(
                    children: [
                      Expanded(
                        child: _dateTile(
                          caption: 'Starts',
                          value: _start,
                          onTap: () => _pickDateTime(isStart: true),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _dateTile(
                          caption: 'Ends',
                          value: _end,
                          onTap: () => _pickDateTime(isStart: false),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _label('Frequency'),
                  DropdownButtonFormField<String>(
                    initialValue: _frequency,
                    isExpanded: true,
                    decoration: _fieldDecoration(null),
                    dropdownColor: OpsColors.card,
                    items: [
                      for (final entry in kFrequencyOptions.entries)
                        DropdownMenuItem(
                          value: entry.key,
                          child: Text(entry.value, overflow: TextOverflow.ellipsis),
                        ),
                    ],
                    onChanged: _saving
                        ? null
                        : (v) => setState(() => _frequency = v ?? _frequency),
                  ),
                  const SizedBox(height: 16),
                  _label('Template name (optional)'),
                  TextFormField(
                    controller: _templateCtrl,
                    enabled: !_saving,
                    maxLength: 60,
                    decoration: _fieldDecoration('Save as a reusable template, e.g. Weekly promo'),
                  ),
                  const SizedBox(height: 4),
                  NotifPanel(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    child: SwitchListTile.adaptive(
                      contentPadding: EdgeInsets.zero,
                      value: _isActive,
                      activeThumbColor: OpsColors.brand,
                      onChanged: _saving ? null : (v) => setState(() => _isActive = v),
                      title: const Text('Active', style: TextStyle(fontWeight: FontWeight.w600)),
                      subtitle: Text(
                        _isActive
                            ? 'Agents will see this inside the schedule window.'
                            : 'Saved as a draft — no agent will see it.',
                        style: const TextStyle(color: Colors.white54, fontSize: 12),
                      ),
                    ),
                  ),
                  if (_submitError != null) ...[
                    const SizedBox(height: 6),
                    OpsError(message: _submitError!),
                  ],
                  const SizedBox(height: 10),
                  FilledButton.icon(
                    onPressed: _saving ? null : _submit,
                    icon: _saving
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Icon(_isEditing ? Icons.save_outlined : Icons.send_rounded, size: 18),
                    label: Text(
                      _saving
                          ? 'Saving…'
                          : _isEditing
                              ? 'Save changes'
                              : 'Publish notification',
                    ),
                    style: FilledButton.styleFrom(
                      backgroundColor: OpsColors.brand,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 15),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _previewSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.visibility_outlined, size: 15, color: OpsColors.brand),
            const SizedBox(width: 6),
            Text(
              'AGENT PREVIEW',
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.6,
                color: OpsColors.brand.withValues(alpha: 0.9),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        AgentPreviewCard(
          title: _titleCtrl.text,
          message: _messageCtrl.text,
          frequency: _frequency,
        ),
        const SizedBox(height: 8),
        Text(
          _targetAgent == null
              ? 'Every agent will receive this.'
              : 'Only ${_targetAgent!.name} will receive this.',
          style: const TextStyle(color: Colors.white38, fontSize: 11),
        ),
      ],
    );
  }

  Widget _audienceSection() {
    if (_targetAgent != null) {
      final agent = _targetAgent!;
      return NotifPanel(
        accent: OpsColors.warning,
        child: Row(
          children: [
            const Icon(Icons.person_outline, size: 18, color: OpsColors.warning),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    agent.name,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    agent.phone?.isNotEmpty == true ? agent.phone! : shortId(agent.id),
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: _saving
                  ? null
                  : () => setState(() {
                        _targetAgent = null;
                        _agentSearchCtrl.clear();
                        _agentResults = const [];
                      }),
              child: const Text('Clear'),
            ),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        NotifPanel(
          accent: OpsColors.brand,
          child: Row(
            children: [
              const Icon(Icons.groups_outlined, size: 18, color: OpsColors.brand),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'All agents (broadcast)',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              NotifTag(label: 'DEFAULT', color: OpsColors.brand),
            ],
          ),
        ),
        TextField(
          controller: _agentSearchCtrl,
          enabled: !_saving,
          onChanged: _onAgentQueryChanged,
          decoration: _fieldDecoration(
            'Or target one agent — type $kAgentSearchMinChars+ characters',
          ).copyWith(
            prefixIcon: const Icon(Icons.search, size: 18),
            suffixIcon: _searchingAgents
                ? const Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(
                      width: 14,
                      height: 14,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  )
                : null,
          ),
        ),
        if (_agentSearchError != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: OpsError(
              message: _agentSearchError!,
              onRetry: () => _searchAgents(_agentSearchCtrl.text.trim()),
            ),
          ),
        if (_agentResults.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 8),
            constraints: const BoxConstraints(maxHeight: 210),
            decoration: BoxDecoration(
              color: OpsColors.card,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: OpsColors.border),
            ),
            child: ListView.separated(
              shrinkWrap: true,
              padding: EdgeInsets.zero,
              itemCount: _agentResults.length,
              separatorBuilder: (_, _) => const Divider(height: 1, color: OpsColors.border),
              itemBuilder: (_, i) {
                final agent = _agentResults[i];
                return ListTile(
                  dense: true,
                  title: Text(
                    agent.name,
                    style: const TextStyle(fontSize: 13),
                    overflow: TextOverflow.ellipsis,
                  ),
                  subtitle: Text(
                    agent.phone?.isNotEmpty == true ? agent.phone! : shortId(agent.id),
                    style: const TextStyle(fontSize: 11),
                    overflow: TextOverflow.ellipsis,
                  ),
                  onTap: () {
                    FocusScope.of(context).unfocus();
                    setState(() {
                      _targetAgent = agent;
                      _agentResults = const [];
                    });
                  },
                );
              },
            ),
          ),
      ],
    );
  }

  Widget _dateTile({
    required String caption,
    required DateTime value,
    required VoidCallback onTap,
  }) {
    return Material(
      color: OpsColors.card,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: _saving ? null : onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: OpsColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.event_outlined, size: 13, color: Colors.white38),
                  const SizedBox(width: 5),
                  Text(caption, style: const TextStyle(color: Colors.white54, fontSize: 11)),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                formatDateTime(value.toIso8601String()),
                style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.white70),
      ),
    );
  }

  InputDecoration _fieldDecoration(String? hint) {
    return InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.white30, fontSize: 13),
      filled: true,
      fillColor: OpsColors.card,
      counterText: '',
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: OpsColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: OpsColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: OpsColors.brand),
      ),
    );
  }
}
