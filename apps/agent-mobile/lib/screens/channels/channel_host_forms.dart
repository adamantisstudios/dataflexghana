import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../services/api_client.dart';
import '../../services/channels_api.dart';
import '../../theme/app_theme.dart';

/// Editor sheets used by the channel host dashboard. Each one owns its own
/// submit call and pops `true` when the channel data changed, so the caller
/// only has to refresh.
///
/// All of them talk to `/api/agent/mobile/channels/[channelId]/…`, which
/// rejects non-hosts with HTTP 403.

Future<bool> showHostSheet(BuildContext context, Widget child) async {
  final saved = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: child,
    ),
  );
  return saved == true;
}

/// Shared chrome: rounded sheet, title, scrollable body, sticky save button.
class HostFormShell extends StatelessWidget {
  const HostFormShell({
    super.key,
    required this.title,
    required this.children,
    required this.saveLabel,
    required this.saving,
    required this.onSave,
    this.subtitle,
  });

  final String title;
  final String? subtitle;
  final List<Widget> children;
  final String saveLabel;
  final bool saving;
  final VoidCallback? onSave;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.92),
      decoration: const BoxDecoration(
        color: DfColors.card,
        borderRadius: BorderRadius.vertical(top: Radius.circular(22)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 8, 4),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.w700),
                      ),
                      if (subtitle != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            subtitle!,
                            style: const TextStyle(fontSize: 12, color: DfColors.muted),
                          ),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: saving ? null : () => Navigator.of(context).pop(false),
                  icon: const Icon(Icons.close),
                  tooltip: 'Close',
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Flexible(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(18, 14, 18, 8),
              shrinkWrap: true,
              children: children,
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 6, 18, 18),
            child: ElevatedButton(
              onPressed: saving ? null : onSave,
              child: saving
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(saveLabel),
            ),
          ),
        ],
      ),
    );
  }
}

InputDecoration hostField(String label, {String? hint}) =>
    InputDecoration(labelText: label, hintText: hint, isDense: false);

Widget hostGap([double h = 12]) => SizedBox(height: h);

/// Runs [action] with a busy flag, surfacing [ApiException] as a snackbar and
/// popping `true` on success.
Future<void> runHostSave(
  BuildContext context, {
  required Future<void> Function() action,
  required void Function(bool) setSaving,
  String? successMessage,
}) async {
  setSaving(true);
  try {
    await action();
    if (!context.mounted) return;
    if (successMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(successMessage)));
    }
    Navigator.of(context).pop(true);
  } on ApiException catch (e) {
    if (!context.mounted) return;
    setSaving(false);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
  } catch (e) {
    if (!context.mounted) return;
    setSaving(false);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
  }
}

// ── Channel settings ────────────────────────────────────────────────────────

class ChannelSettingsForm extends StatefulWidget {
  const ChannelSettingsForm({super.key, required this.channelId, required this.channel});

  final String channelId;
  final Map<String, dynamic> channel;

  @override
  State<ChannelSettingsForm> createState() => _ChannelSettingsFormState();
}

class _ChannelSettingsFormState extends State<ChannelSettingsForm> {
  late final TextEditingController _name;
  late final TextEditingController _description;
  late final TextEditingController _category;
  late final TextEditingController _maxMembers;
  late bool _active;
  late bool _public;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _name = TextEditingController(text: widget.channel['name']?.toString() ?? '');
    _description = TextEditingController(text: widget.channel['description']?.toString() ?? '');
    _category = TextEditingController(text: widget.channel['category']?.toString() ?? '');
    _maxMembers = TextEditingController(text: widget.channel['max_members']?.toString() ?? '');
    _active = widget.channel['is_active'] != false;
    _public = widget.channel['is_public'] != false;
  }

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _category.dispose();
    _maxMembers.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return HostFormShell(
      title: 'Channel settings',
      subtitle: 'Name, description, visibility and capacity',
      saveLabel: 'Save settings',
      saving: _saving,
      onSave: () {
        if (_name.text.trim().isEmpty) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Channel name is required')));
          return;
        }
        final max = int.tryParse(_maxMembers.text.trim());
        runHostSave(
          context,
          setSaving: (v) => setState(() => _saving = v),
          successMessage: 'Channel settings updated',
          action: () => ChannelsApi.instance.updateChannelSettings(
            widget.channelId,
            name: _name.text.trim(),
            description: _description.text.trim(),
            category: _category.text.trim().isEmpty ? null : _category.text.trim(),
            isActive: _active,
            isPublic: _public,
            maxMembers: max,
          ),
        );
      },
      children: [
        TextField(controller: _name, decoration: hostField('Channel name')),
        hostGap(),
        TextField(
          controller: _description,
          maxLines: 4,
          decoration: hostField('Description'),
        ),
        hostGap(),
        TextField(controller: _category, decoration: hostField('Category', hint: 'e.g. Mathematics')),
        hostGap(),
        TextField(
          controller: _maxMembers,
          keyboardType: TextInputType.number,
          decoration: hostField('Maximum members'),
        ),
        hostGap(),
        SwitchListTile(
          value: _active,
          onChanged: (v) => setState(() => _active = v),
          title: const Text('Channel active'),
          subtitle: const Text('Inactive channels are hidden from members'),
          contentPadding: EdgeInsets.zero,
          activeThumbColor: DfColors.brand,
        ),
        SwitchListTile(
          value: _public,
          onChanged: (v) => setState(() => _public = v),
          title: const Text('Publicly listed'),
          subtitle: const Text('Agents can discover and request to join'),
          contentPadding: EdgeInsets.zero,
          activeThumbColor: DfColors.brand,
        ),
      ],
    );
  }
}

// ── Lesson / announcement post ──────────────────────────────────────────────

class PostComposerForm extends StatefulWidget {
  const PostComposerForm({super.key, required this.channelId, this.post});

  final String channelId;

  /// When supplied the form edits that post instead of creating a new one.
  final Map<String, dynamic>? post;

  @override
  State<PostComposerForm> createState() => _PostComposerFormState();
}

class _PostComposerFormState extends State<PostComposerForm> {
  static const _types = ['lesson', 'announcement', 'resource', 'discussion'];

  late final TextEditingController _title;
  late final TextEditingController _content;
  late String _type;
  late bool _pinned;
  bool _saving = false;

  bool get _editing => widget.post != null;

  @override
  void initState() {
    super.initState();
    _title = TextEditingController(text: widget.post?['title']?.toString() ?? '');
    _content = TextEditingController(text: widget.post?['content']?.toString() ?? '');
    final t = widget.post?['post_type']?.toString() ?? 'lesson';
    _type = _types.contains(t) ? t : 'lesson';
    _pinned = widget.post?['is_pinned'] == true;
  }

  @override
  void dispose() {
    _title.dispose();
    _content.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return HostFormShell(
      title: _editing ? 'Edit post' : 'Create lesson post',
      subtitle: 'Shared with every active member of the channel',
      saveLabel: _editing ? 'Save changes' : 'Publish post',
      saving: _saving,
      onSave: () {
        if (_title.text.trim().isEmpty || _content.text.trim().isEmpty) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Title and content are required')));
          return;
        }
        runHostSave(
          context,
          setSaving: (v) => setState(() => _saving = v),
          successMessage: _editing ? 'Post updated' : 'Post published',
          action: () async {
            if (_editing) {
              await ChannelsApi.instance.updatePost(
                widget.channelId,
                postId: widget.post!['id'].toString(),
                title: _title.text.trim(),
                content: _content.text.trim(),
                postType: _type,
                pinned: _pinned,
              );
            } else {
              await ChannelsApi.instance.createPost(
                widget.channelId,
                title: _title.text.trim(),
                content: _content.text.trim(),
                postType: _type,
                pinned: _pinned,
              );
            }
          },
        );
      },
      children: [
        DropdownButtonFormField<String>(
          initialValue: _type,
          decoration: hostField('Post type'),
          items: _types
              .map((t) => DropdownMenuItem(value: t, child: Text(_label(t))))
              .toList(),
          onChanged: (v) => setState(() => _type = v ?? 'lesson'),
        ),
        hostGap(),
        TextField(controller: _title, decoration: hostField('Title')),
        hostGap(),
        TextField(
          controller: _content,
          maxLines: 10,
          minLines: 5,
          decoration: hostField('Content', hint: 'Write the lesson…'),
        ),
        hostGap(),
        SwitchListTile(
          value: _pinned,
          onChanged: (v) => setState(() => _pinned = v),
          title: const Text('Pin to the top of the feed'),
          contentPadding: EdgeInsets.zero,
          activeThumbColor: DfColors.brand,
        ),
      ],
    );
  }

  String _label(String type) => '${type[0].toUpperCase()}${type.substring(1)}';
}

// ── Quiz ────────────────────────────────────────────────────────────────────

class QuizComposerForm extends StatefulWidget {
  const QuizComposerForm({super.key, required this.channelId});

  final String channelId;

  @override
  State<QuizComposerForm> createState() => _QuizComposerFormState();
}

class _QuizComposerFormState extends State<QuizComposerForm> {
  final _question = TextEditingController();
  final _a = TextEditingController();
  final _b = TextEditingController();
  final _c = TextEditingController();
  final _d = TextEditingController();
  final _e = TextEditingController();
  final _explanation = TextEditingController();
  String _correct = 'A';
  bool _reveal = false;
  bool _saving = false;

  @override
  void dispose() {
    _question.dispose();
    _a.dispose();
    _b.dispose();
    _c.dispose();
    _d.dispose();
    _e.dispose();
    _explanation.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return HostFormShell(
      title: 'Create quiz',
      subtitle: 'Options A–D are required. LaTeX like \$\$x^2\$\$ is supported.',
      saveLabel: 'Publish quiz',
      saving: _saving,
      onSave: () {
        final missing = _question.text.trim().isEmpty ||
            _a.text.trim().isEmpty ||
            _b.text.trim().isEmpty ||
            _c.text.trim().isEmpty ||
            _d.text.trim().isEmpty;
        if (missing) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Question and options A–D are required')),
          );
          return;
        }
        if (_correct == 'E' && _e.text.trim().isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Option E is empty but marked as the answer')),
          );
          return;
        }
        runHostSave(
          context,
          setSaving: (v) => setState(() => _saving = v),
          successMessage: 'Quiz published',
          action: () => ChannelsApi.instance.createQuiz(
            widget.channelId,
            question: _question.text.trim(),
            optionA: _a.text.trim(),
            optionB: _b.text.trim(),
            optionC: _c.text.trim(),
            optionD: _d.text.trim(),
            optionE: _e.text.trim(),
            correctAnswer: _correct,
            explanation: _explanation.text.trim(),
            revealed: _reveal,
          ),
        );
      },
      children: [
        TextField(
          controller: _question,
          maxLines: 4,
          minLines: 2,
          decoration: hostField('Question'),
        ),
        hostGap(),
        TextField(controller: _a, decoration: hostField('Option A')),
        hostGap(8),
        TextField(controller: _b, decoration: hostField('Option B')),
        hostGap(8),
        TextField(controller: _c, decoration: hostField('Option C')),
        hostGap(8),
        TextField(controller: _d, decoration: hostField('Option D')),
        hostGap(8),
        TextField(controller: _e, decoration: hostField('Option E (optional)')),
        hostGap(),
        DropdownButtonFormField<String>(
          initialValue: _correct,
          decoration: hostField('Correct answer'),
          items: const ['A', 'B', 'C', 'D', 'E']
              .map((v) => DropdownMenuItem(value: v, child: Text(v)))
              .toList(),
          onChanged: (v) => setState(() => _correct = v ?? 'A'),
        ),
        hostGap(),
        TextField(
          controller: _explanation,
          maxLines: 4,
          decoration: hostField('Explanation (optional)'),
        ),
        hostGap(),
        SwitchListTile(
          value: _reveal,
          onChanged: (v) => setState(() => _reveal = v),
          title: const Text('Reveal the answer immediately'),
          contentPadding: EdgeInsets.zero,
          activeThumbColor: DfColors.brand,
        ),
      ],
    );
  }
}

// ── Video ───────────────────────────────────────────────────────────────────

class VideoComposerForm extends StatefulWidget {
  const VideoComposerForm({super.key, required this.channelId});

  final String channelId;

  @override
  State<VideoComposerForm> createState() => _VideoComposerFormState();
}

class _VideoComposerFormState extends State<VideoComposerForm> {
  final _title = TextEditingController();
  final _description = TextEditingController();
  final _youtubeUrl = TextEditingController();
  final _embedCode = TextEditingController();
  final _platform = TextEditingController(text: 'other');
  String _source = 'youtube';
  bool _saving = false;

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _youtubeUrl.dispose();
    _embedCode.dispose();
    _platform.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final youtube = _source == 'youtube';
    return HostFormShell(
      title: 'Post a video',
      subtitle: 'Video file uploads are still done on the website',
      saveLabel: 'Post video',
      saving: _saving,
      onSave: () {
        if (_title.text.trim().isEmpty) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Title is required')));
          return;
        }
        if (youtube && _youtubeUrl.text.trim().isEmpty) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('YouTube link is required')));
          return;
        }
        if (!youtube && _embedCode.text.trim().isEmpty) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Embed code is required')));
          return;
        }
        runHostSave(
          context,
          setSaving: (v) => setState(() => _saving = v),
          successMessage: 'Video posted',
          action: () async {
            if (youtube) {
              await ChannelsApi.instance.postYouTubeVideo(
                widget.channelId,
                title: _title.text.trim(),
                youtubeUrl: _youtubeUrl.text.trim(),
                description: _description.text.trim(),
              );
            } else {
              await ChannelsApi.instance.postEmbedVideo(
                widget.channelId,
                title: _title.text.trim(),
                embedCode: _embedCode.text.trim(),
                platform: _platform.text.trim().isEmpty ? 'other' : _platform.text.trim(),
              );
            }
          },
        );
      },
      children: [
        SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'youtube', label: Text('YouTube'), icon: Icon(Icons.smart_display_outlined)),
            ButtonSegment(value: 'embed', label: Text('Embed'), icon: Icon(Icons.code)),
          ],
          selected: {_source},
          onSelectionChanged: (s) => setState(() => _source = s.first),
        ),
        hostGap(),
        TextField(controller: _title, decoration: hostField('Title')),
        hostGap(),
        if (youtube) ...[
          TextField(
            controller: _youtubeUrl,
            decoration: hostField('YouTube link or video ID', hint: 'https://youtu.be/…'),
          ),
          hostGap(),
          TextField(
            controller: _description,
            maxLines: 4,
            decoration: hostField('Description (optional)'),
          ),
        ] else ...[
          TextField(
            controller: _embedCode,
            maxLines: 6,
            minLines: 3,
            decoration: hostField('Embed code', hint: '<iframe …></iframe>'),
          ),
          hostGap(),
          TextField(controller: _platform, decoration: hostField('Platform')),
        ],
      ],
    );
  }
}

// ── Lesson note ─────────────────────────────────────────────────────────────

class LessonNoteForm extends StatefulWidget {
  const LessonNoteForm({super.key, required this.channelId, this.note});

  final String channelId;
  final Map<String, dynamic>? note;

  @override
  State<LessonNoteForm> createState() => _LessonNoteFormState();
}

class _LessonNoteFormState extends State<LessonNoteForm> {
  late final TextEditingController _title;
  late final TextEditingController _content;
  bool _saving = false;

  bool get _editing => widget.note != null;

  @override
  void initState() {
    super.initState();
    _title = TextEditingController(text: widget.note?['title']?.toString() ?? '');
    _content = TextEditingController(text: widget.note?['content']?.toString() ?? '');
  }

  @override
  void dispose() {
    _title.dispose();
    _content.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return HostFormShell(
      title: _editing ? 'Edit lesson note' : 'New lesson note',
      saveLabel: 'Save note',
      saving: _saving,
      onSave: () {
        if (_title.text.trim().isEmpty || _content.text.trim().isEmpty) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Title and content are required')));
          return;
        }
        runHostSave(
          context,
          setSaving: (v) => setState(() => _saving = v),
          successMessage: 'Lesson note saved',
          action: () async {
            if (_editing) {
              await ChannelsApi.instance.updateLessonNote(
                widget.channelId,
                noteId: widget.note!['id'].toString(),
                title: _title.text.trim(),
                content: _content.text.trim(),
              );
            } else {
              await ChannelsApi.instance.createLessonNote(
                widget.channelId,
                title: _title.text.trim(),
                content: _content.text.trim(),
              );
            }
          },
        );
      },
      children: [
        TextField(controller: _title, decoration: hostField('Title')),
        hostGap(),
        TextField(
          controller: _content,
          maxLines: 12,
          minLines: 6,
          decoration: hostField('Note content'),
        ),
      ],
    );
  }
}

// ── Announcement (text / link broadcast) ────────────────────────────────────

class AnnouncementForm extends StatefulWidget {
  const AnnouncementForm({super.key, required this.channelId});

  final String channelId;

  @override
  State<AnnouncementForm> createState() => _AnnouncementFormState();
}

class _AnnouncementFormState extends State<AnnouncementForm> {
  final _content = TextEditingController();
  final _linkTitle = TextEditingController();
  final _linkUrl = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _content.dispose();
    _linkTitle.dispose();
    _linkUrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return HostFormShell(
      title: 'Share an update',
      subtitle: 'Appears in the member feed as a channel message',
      saveLabel: 'Send to channel',
      saving: _saving,
      onSave: () {
        if (_content.text.trim().isEmpty) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Write something to share')));
          return;
        }
        final url = _linkUrl.text.trim();
        runHostSave(
          context,
          setSaving: (v) => setState(() => _saving = v),
          successMessage: 'Update shared',
          action: () => ChannelsApi.instance.postAnnouncement(
            widget.channelId,
            content: _content.text.trim(),
            links: url.isEmpty
                ? const []
                : [
                    {
                      'url': url,
                      'title': _linkTitle.text.trim().isEmpty ? url : _linkTitle.text.trim(),
                    },
                  ],
          ),
        );
      },
      children: [
        TextField(
          controller: _content,
          maxLines: 8,
          minLines: 4,
          decoration: hostField('Message'),
        ),
        hostGap(),
        Text(
          'Attach a link (optional)',
          style: GoogleFonts.outfit(fontSize: 13, fontWeight: FontWeight.w700),
        ),
        hostGap(8),
        TextField(controller: _linkTitle, decoration: hostField('Link label')),
        hostGap(8),
        TextField(controller: _linkUrl, decoration: hostField('URL', hint: 'https://…')),
        hostGap(),
        const Text(
          'Images, audio notes and documents still need the website — the mobile app posts text and links.',
          style: TextStyle(fontSize: 11.5, color: DfColors.muted, height: 1.5),
        ),
      ],
    );
  }
}

// ── Add member ──────────────────────────────────────────────────────────────

class AddMemberForm extends StatefulWidget {
  const AddMemberForm({super.key, required this.channelId});

  final String channelId;

  @override
  State<AddMemberForm> createState() => _AddMemberFormState();
}

class _AddMemberFormState extends State<AddMemberForm> {
  final _query = TextEditingController();
  String _role = 'member';
  bool _saving = false;

  @override
  void dispose() {
    _query.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return HostFormShell(
      title: 'Add member directly',
      subtitle: 'Search by phone number or full name',
      saveLabel: 'Add member',
      saving: _saving,
      onSave: () {
        if (_query.text.trim().isEmpty) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Enter a name or phone number')));
          return;
        }
        runHostSave(
          context,
          setSaving: (v) => setState(() => _saving = v),
          successMessage: 'Member added',
          action: () => ChannelsApi.instance.addMember(
            widget.channelId,
            query: _query.text.trim(),
            role: _role,
          ),
        );
      },
      children: [
        TextField(controller: _query, decoration: hostField('Agent name or phone number')),
        hostGap(),
        DropdownButtonFormField<String>(
          initialValue: _role,
          decoration: hostField('Role'),
          items: const [
            DropdownMenuItem(value: 'member', child: Text('Member — read and react')),
            DropdownMenuItem(value: 'teacher', child: Text('Teacher — can post')),
            DropdownMenuItem(value: 'admin', child: Text('Admin — full control')),
          ],
          onChanged: (v) => setState(() => _role = v ?? 'member'),
        ),
      ],
    );
  }
}

// ── Subscription settings ───────────────────────────────────────────────────

class SubscriptionForm extends StatefulWidget {
  const SubscriptionForm({super.key, required this.channelId, this.settings});

  final String channelId;
  final Map<String, dynamic>? settings;

  @override
  State<SubscriptionForm> createState() => _SubscriptionFormState();
}

class _SubscriptionFormState extends State<SubscriptionForm> {
  late final TextEditingController _fee;
  late final TextEditingController _instructions;
  late final TextEditingController _contactName;
  late final TextEditingController _contactNumber;
  late bool _enabled;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final s = widget.settings ?? const {};
    _enabled = s['is_enabled'] == true;
    final fee = s['monthly_fee'];
    _fee = TextEditingController(text: fee is num ? fee.toStringAsFixed(2) : '');
    _instructions = TextEditingController(text: s['payment_instructions']?.toString() ?? '');
    _contactName = TextEditingController(text: s['payment_contact_name']?.toString() ?? '');
    _contactNumber = TextEditingController(text: s['payment_contact_number']?.toString() ?? '');
  }

  @override
  void dispose() {
    _fee.dispose();
    _instructions.dispose();
    _contactName.dispose();
    _contactNumber.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return HostFormShell(
      title: 'Subscription settings',
      subtitle: 'Members pay you directly — payment is verified manually',
      saveLabel: 'Save settings',
      saving: _saving,
      onSave: () {
        final fee = double.tryParse(_fee.text.trim()) ?? 0;
        if (_enabled && fee <= 0) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Enter a monthly fee above zero')));
          return;
        }
        if (_enabled && _instructions.text.trim().isEmpty) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Payment instructions are required')));
          return;
        }
        runHostSave(
          context,
          setSaving: (v) => setState(() => _saving = v),
          successMessage: 'Subscription settings saved',
          action: () => ChannelsApi.instance.saveSubscriptionSettings(
            widget.channelId,
            enabled: _enabled,
            monthlyFee: fee,
            instructions: _instructions.text.trim(),
            contactName: _contactName.text.trim(),
            contactNumber: _contactNumber.text.trim(),
          ),
        );
      },
      children: [
        SwitchListTile(
          value: _enabled,
          onChanged: (v) => setState(() => _enabled = v),
          title: const Text('Charge for access'),
          subtitle: Text(_enabled ? 'Subscriptions are active' : 'The channel is free to join'),
          contentPadding: EdgeInsets.zero,
          activeThumbColor: DfColors.brand,
        ),
        if (_enabled) ...[
          hostGap(),
          TextField(
            controller: _fee,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: hostField('Monthly fee (GHS)'),
          ),
          hostGap(),
          TextField(
            controller: _instructions,
            maxLines: 5,
            minLines: 3,
            decoration: hostField('Payment instructions', hint: 'Mobile money, bank transfer…'),
          ),
          hostGap(),
          TextField(controller: _contactName, decoration: hostField('Payment contact name')),
          hostGap(),
          TextField(
            controller: _contactNumber,
            keyboardType: TextInputType.phone,
            decoration: hostField('Payment contact number'),
          ),
        ],
      ],
    );
  }
}
