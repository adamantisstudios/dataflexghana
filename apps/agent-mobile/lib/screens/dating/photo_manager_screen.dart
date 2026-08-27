import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../services/dating_api.dart';
import '../../theme/app_theme.dart';
import '../../widgets/authed_network_image.dart';
import 'dating_common.dart';
import 'dating_constants.dart';

/// Upload, delete and reorder the up-to-five dating photos. The first photo is
/// the one shown in discover, so ordering matters.
class PhotoManagerScreen extends StatefulWidget {
  const PhotoManagerScreen({super.key, required this.photos});

  final List<Map<String, dynamic>> photos;

  @override
  State<PhotoManagerScreen> createState() => _PhotoManagerScreenState();
}

class _PhotoManagerScreenState extends State<PhotoManagerScreen> {
  late List<Map<String, dynamic>> _photos;
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _photos = List<Map<String, dynamic>>.from(widget.photos);
  }

  Future<void> _pick(ImageSource source) async {
    if (_photos.length >= maxDatingPhotos) {
      showDatingSnack(context, 'Maximum $maxDatingPhotos photos', danger: true);
      return;
    }
    final picked = await ImagePicker().pickImage(
      source: source,
      maxWidth: 1600,
      imageQuality: 88,
    );
    if (picked == null) return;

    setState(() => _busy = true);
    try {
      final res = await DatingApi.instance.uploadPhoto(picked);
      if (!mounted) return;
      final photos = asMapList(res['photos']);
      setState(() {
        if (photos.isNotEmpty) {
          _photos = photos;
        } else if (res['photo'] is Map) {
          _photos.add(Map<String, dynamic>.from(res['photo'] as Map));
        }
      });
      showDatingSnack(context, 'Photo uploaded');
    } catch (e) {
      if (mounted) showDatingSnack(context, errorMessage(e), danger: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _delete(Map<String, dynamic> photo) async {
    final id = photo['id']?.toString() ?? '';
    if (id.isEmpty) return;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Delete this photo?'),
        content: const Text('It is removed from your profile immediately.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Delete', style: TextStyle(color: DfColors.danger)),
          ),
        ],
      ),
    );
    if (confirmed != true) return;

    setState(() => _busy = true);
    try {
      await DatingApi.instance.deletePhoto(id);
      if (!mounted) return;
      setState(() => _photos.removeWhere((p) => p['id']?.toString() == id));
      showDatingSnack(context, 'Photo deleted');
    } catch (e) {
      if (mounted) showDatingSnack(context, errorMessage(e), danger: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _persistOrder() async {
    final ids = _photos.map((p) => p['id']?.toString() ?? '').where((s) => s.isNotEmpty).toList();
    if (ids.length < 2) return;
    setState(() => _busy = true);
    try {
      final res = await DatingApi.instance.reorderPhotos(ids);
      if (!mounted) return;
      final photos = asMapList(res['photos']);
      if (photos.isNotEmpty) setState(() => _photos = photos);
      showDatingSnack(context, 'Photo order saved');
    } catch (e) {
      if (mounted) showDatingSnack(context, errorMessage(e), danger: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Dating photos'),
        actions: [
          IconButton(
            tooltip: 'Done',
            icon: const Icon(Icons.check),
            onPressed: () => Navigator.pop(context, _photos),
          ),
        ],
      ),
      body: Column(
        children: [
          if (_busy) const LinearProgressIndicator(minHeight: 3, color: DfColors.brand),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                DatingSection(
                  title: 'Your photos (${_photos.length}/$maxDatingPhotos)',
                  subtitle:
                      'At least one photo is required before you can submit for approval. Drag to reorder — the first photo is your headline.',
                  child: _photos.isEmpty
                      ? const Text(
                          'No photos yet. Add a clear, recent photo of your face.',
                          style: TextStyle(color: DfColors.muted),
                        )
                      : ReorderableListView(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          buildDefaultDragHandles: false,
                          onReorderItem: (oldIndex, newIndex) {
                            setState(() {
                              final item = _photos.removeAt(oldIndex);
                              _photos.insert(newIndex, item);
                            });
                            _persistOrder();
                          },
                          children: [
                            for (var i = 0; i < _photos.length; i++)
                              _photoTile(_photos[i], i),
                          ],
                        ),
                ),
                DatingSection(
                  title: 'Add a photo',
                  subtitle: 'JPEG, PNG or WebP under 10MB.',
                  child: Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _busy ? null : () => _pick(ImageSource.gallery),
                          icon: const Icon(Icons.photo_library_outlined, size: 18),
                          label: const Text('Gallery'),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _busy ? null : () => _pick(ImageSource.camera),
                          icon: const Icon(Icons.photo_camera_outlined, size: 18),
                          label: const Text('Camera'),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _photoTile(Map<String, dynamic> photo, int index) {
    final url = DatingApi.absolutize(photo['public_url']?.toString());
    return Padding(
      key: ValueKey(photo['id']?.toString() ?? 'photo-$index'),
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          AuthedNetworkImage(
            imageUrl: url,
            height: 74,
            width: 74,
            borderRadius: BorderRadius.circular(12),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  index == 0 ? 'Headline photo' : 'Photo ${index + 1}',
                  style: GoogleFonts.outfit(fontWeight: FontWeight.w700, fontSize: 14.5),
                ),
                const SizedBox(height: 3),
                const Text(
                  'Drag the handle to reorder',
                  style: TextStyle(color: DfColors.muted, fontSize: 12),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Delete',
            icon: const Icon(Icons.delete_outline, color: DfColors.danger),
            onPressed: _busy ? null : () => _delete(photo),
          ),
          ReorderableDragStartListener(
            index: index,
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 4),
              child: Icon(Icons.drag_handle, color: DfColors.muted),
            ),
          ),
        ],
      ),
    );
  }
}
