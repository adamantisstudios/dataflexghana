import 'package:flutter/material.dart';

import '../../services/api_client.dart';
import '../../services/channels_api.dart';
import '../../theme/app_theme.dart';
import 'channel_host_dashboard_screen.dart';
import 'channel_host_forms.dart';

/// "Create a teaching channel" sheet, ready to be opened from the channels
/// list. On success it drops the new host straight into their console.
///
/// Wire it with [openChannelCreateSheet]; it returns the new channel id when
/// one was created so the caller can refresh its list.
class ChannelCreateSheet extends StatefulWidget {
  const ChannelCreateSheet({super.key});

  @override
  State<ChannelCreateSheet> createState() => _ChannelCreateSheetState();
}

class _ChannelCreateSheetState extends State<ChannelCreateSheet> {
  final _name = TextEditingController();
  final _description = TextEditingController();
  final _category = TextEditingController(text: 'General');
  bool _public = true;
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    _description.dispose();
    _category.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_name.text.trim().isEmpty) {
      ScaffoldMessenger.of(context)
          .showSnackBar(const SnackBar(content: Text('Channel name is required')));
      return;
    }
    setState(() => _saving = true);
    try {
      final data = await ChannelsApi.instance.createChannel(
        name: _name.text.trim(),
        description: _description.text.trim(),
        category: _category.text.trim().isEmpty ? 'General' : _category.text.trim(),
        isPublic: _public,
      );
      if (!mounted) return;
      Navigator.of(context).pop(data['channelId']?.toString());
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    } catch (e) {
      if (!mounted) return;
      setState(() => _saving = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return HostFormShell(
      title: 'Create a teaching channel',
      subtitle: 'You become the channel teacher and can invite members',
      saveLabel: 'Create channel',
      saving: _saving,
      onSave: _submit,
      children: [
        TextField(controller: _name, decoration: hostField('Channel name')),
        hostGap(),
        TextField(
          controller: _description,
          maxLines: 4,
          decoration: hostField('What will you teach?'),
        ),
        hostGap(),
        TextField(controller: _category, decoration: hostField('Category')),
        hostGap(),
        SwitchListTile(
          value: _public,
          onChanged: (v) => setState(() => _public = v),
          title: const Text('Publicly listed'),
          subtitle: const Text('Agents can find it and request to join'),
          contentPadding: EdgeInsets.zero,
          activeThumbColor: DfColors.brand,
        ),
        hostGap(),
        const Text(
          'Channel creation is approved by DataFlex. If you are not cleared to '
          'open one you will be asked to contact support.',
          style: TextStyle(fontSize: 11.5, color: DfColors.muted, height: 1.5),
        ),
      ],
    );
  }
}

/// Opens [ChannelCreateSheet] and, when a channel is created, pushes the host
/// console for it. Returns the new channel id, or null if nothing was created.
Future<String?> openChannelCreateSheet(BuildContext context) async {
  final channelId = await showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: const ChannelCreateSheet(),
    ),
  );

  if (channelId == null || channelId.isEmpty || !context.mounted) return channelId;

  await Navigator.of(context).push(
    MaterialPageRoute(
      builder: (_) => ChannelHostDashboardScreen(channelId: channelId),
    ),
  );
  return channelId;
}
