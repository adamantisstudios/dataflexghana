import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../services/api_client.dart';
import '../services/face_photo_validation.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';

/// Same behavior as website [AgentPhotoVerificationGate]:
/// approved agents without a verified photo are locked until they selfie-verify.
class PhotoVerificationGate extends StatefulWidget {
  const PhotoVerificationGate({super.key, required this.child});

  final Widget child;

  @override
  State<PhotoVerificationGate> createState() => _PhotoVerificationGateState();
}

class _PhotoVerificationGateState extends State<PhotoVerificationGate> {
  bool _checking = true;
  bool _locked = false;
  Map<String, dynamic>? _agent;
  bool _uploading = false;
  String? _error;
  Timer? _poll;

  @override
  void initState() {
    super.initState();
    _refresh();
    _poll = Timer.periodic(const Duration(seconds: 10), (_) => _refresh(silent: true));
  }

  @override
  void dispose() {
    _poll?.cancel();
    super.dispose();
  }

  bool _isPlatformAdmin(Map<String, dynamic>? agent) {
    final email = agent?['email']?.toString().toLowerCase() ?? '';
    return email.contains('admin') || agent?['is_platform_admin'] == true;
  }

  String _photoStatus(Map<String, dynamic>? agent) {
    if (agent == null) return 'unverified';
    if (agent['profile_verified'] == true) return 'verified';
    final url = agent['profile_image_url']?.toString().trim() ?? '';
    if (url.isNotEmpty) return 'pending';
    return 'unverified';
  }

  bool _requiresLock(Map<String, dynamic>? agent) {
    if (agent == null) return false;
    if (agent['isapproved'] != true && agent['is_approved'] != true) return false;
    if (_isPlatformAdmin(agent)) return false;
    return _photoStatus(agent) != 'verified';
  }

  Future<void> _refresh({bool silent = false}) async {
    if (!silent && mounted) setState(() => _checking = true);
    try {
      final data = await ApiClient.instance.refreshAgentProfile(forceRefresh: true);
      final agent = data['agent'];
      final map = agent is Map ? Map<String, dynamic>.from(agent) : await SessionStore.instance.getAgent();
      if (!mounted) return;
      setState(() {
        _agent = map;
        _locked = _requiresLock(map);
        _checking = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;
      // Fall back to stored session so we don't soft-lock on network blips.
      final stored = await SessionStore.instance.getAgent();
      setState(() {
        _agent = stored;
        _locked = _requiresLock(stored);
        _checking = false;
        if (!silent) _error = e.toString();
      });
    }
  }

  Future<void> _takeSelfie() async {
    setState(() {
      _error = null;
      _uploading = true;
    });
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(
        source: ImageSource.camera,
        preferredCameraDevice: CameraDevice.front,
        imageQuality: 85,
        maxWidth: 1600,
      );
      if (file == null) {
        setState(() => _uploading = false);
        return;
      }

      // Same quality gate the website runs, so a good selfie is approved
      // instantly here too instead of always queuing for admin review.
      final check = await validateFacePhoto(File(file.path));
      if (!check.ok && !check.detectorUnavailable) {
        // Website behaviour: a failed photo is not uploaded at all — retake it.
        setState(() {
          _error = check.error;
          _uploading = false;
        });
        return;
      }
      // Detection unavailable (e.g. no Play Services) falls through with
      // autoApproved false, so the agent is reviewed rather than blocked.
      final autoApproved = check.ok;

      final url = await ApiClient.instance.uploadAgentImage(file);
      if (url.isEmpty) throw ApiException('Upload failed — empty URL');
      final verified = await ApiClient.instance.verifyProfilePhoto(
        url,
        autoApproved: autoApproved,
      );
      final agent = await SessionStore.instance.getAgent() ?? {};
      await SessionStore.instance.saveAgent({
        ...agent,
        'profile_image_url': url,
        if (verified['profile_verified'] != null) 'profile_verified': verified['profile_verified'],
      });
      await _refresh();
      if (!mounted) return;
      final ok = verified['profile_verified'] == true;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            ok
                ? 'Photo verified instantly. Welcome in.'
                : 'Photo received for admin review. Access unlocks when approved.',
          ),
        ),
      );
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _logout() async {
    await SessionStore.instance.clear();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (_) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_checking && _agent == null) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: DfColors.brand)),
      );
    }

    if (!_locked) return widget.child;

    final pending = _photoStatus(_agent) == 'pending';

    return Scaffold(
      backgroundColor: const Color(0xFFEEF2FF),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: Colors.black12),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 24,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: LinearGradient(
                          colors: [
                            Colors.blue.shade100,
                            Colors.indigo.shade50,
                            Colors.purple.shade50,
                          ],
                        ),
                      ),
                      child: Icon(
                        pending ? Icons.hourglass_top_rounded : Icons.face_retouching_natural_rounded,
                        size: 44,
                        color: DfColors.brandDark,
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      pending ? "We're reviewing your photo" : 'One quick step before you begin',
                      textAlign: TextAlign.center,
                      style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      pending
                          ? "Thanks for submitting your verification photo. Our team is reviewing it now — you'll get full access as soon as your account is approved."
                          : 'Welcome! To keep our community safe, every agent must verify with a clear selfie. Use your camera, then wait for approval before using the dashboard.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: DfColors.muted, height: 1.45, fontSize: 14),
                    ),
                    if (!pending) ...[
                      const SizedBox(height: 22),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _uploading ? null : _takeSelfie,
                          icon: _uploading
                              ? const SizedBox(
                                  width: 18,
                                  height: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.photo_camera_rounded),
                          label: Text(_uploading ? 'Uploading…' : 'Take verification photo'),
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Camera only — same as the website. Use a well-lit photo of your face.',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: DfColors.muted),
                      ),
                    ] else ...[
                      const SizedBox(height: 18),
                      OutlinedButton.icon(
                        onPressed: _uploading ? null : _refresh,
                        icon: const Icon(Icons.refresh_rounded),
                        label: const Text('Check approval status'),
                      ),
                    ],
                    if (_error != null) ...[
                      const SizedBox(height: 12),
                      Text(_error!, textAlign: TextAlign.center, style: const TextStyle(color: DfColors.danger)),
                    ],
                    const SizedBox(height: 16),
                    TextButton.icon(
                      onPressed: _logout,
                      icon: const Icon(Icons.logout_rounded),
                      label: const Text('Log out'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
