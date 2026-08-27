import 'dart:io';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../services/api_client.dart';
import '../services/face_photo_validation.dart';
import '../services/session_store.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _email = TextEditingController();
  final _profession = TextEditingController();
  final _exactLocation = TextEditingController();
  final _currentPassword = TextEditingController();
  final _newPassword = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _deleteConfirm = TextEditingController();
  final _totpCode = TextEditingController();
  final _disablePassword = TextEditingController();

  Map<String, dynamic>? _agent;
  String? _profileImageUrl;
  XFile? _localPhoto;
  bool _loading = true;
  bool _savingProfile = false;
  bool _uploadingPhoto = false;
  bool _changingPassword = false;
  bool _deleting = false;
  String? _error;

  bool _twoFaEnabled = false;
  bool _twoFaPending = false;
  int _backupRemaining = 0;
  String? _setupSecret;
  String? _setupOtpauth;
  bool _twoFaBusy = false;

  bool _showCurrent = false;
  bool _showNew = false;
  bool _showConfirm = false;

  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _email.dispose();
    _profession.dispose();
    _exactLocation.dispose();
    _currentPassword.dispose();
    _newPassword.dispose();
    _confirmPassword.dispose();
    _deleteConfirm.dispose();
    _totpCode.dispose();
    _disablePassword.dispose();
    super.dispose();
  }

  void _snack(String msg, {bool error = false}) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: error ? DfColors.danger : null),
    );
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final data = await ApiClient.instance.agentSettings(forceRefresh: true);
      final agent = data['agent'];
      if (agent is Map<String, dynamic>) {
        _applyAgent(agent);
      }
      await _load2fa();
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } catch (e) {
      setState(() => _error = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _applyAgent(Map<String, dynamic> agent) {
    _agent = agent;
    _email.text = agent['email']?.toString() ?? '';
    _profession.text = agent['profession']?.toString() ?? '';
    _exactLocation.text = agent['exact_location']?.toString() ?? '';
    _profileImageUrl = agent['profile_image_url']?.toString();
  }

  Future<void> _load2fa() async {
    try {
      final s = await ApiClient.instance.twoFactorStatus();
      if (!mounted) return;
      setState(() {
        _twoFaEnabled = s['enabled'] == true;
        _twoFaPending = s['pendingSetup'] == true;
        _backupRemaining = (s['backupCodesRemaining'] is num)
            ? (s['backupCodesRemaining'] as num).toInt()
            : 0;
      });
    } catch (_) {}
  }

  Future<void> _pickPhoto() async {
    final file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
    if (file == null) return;
    setState(() {
      _localPhoto = file;
      _uploadingPhoto = true;
    });
    try {
      // Auto-approve when the photo passes the same checks the website runs.
      // Unlike the verification gate, a failure still uploads for admin review
      // here — the agent isn't locked out, so refusing outright would be harsh.
      final check = await validateFacePhoto(File(file.path));

      final url = await ApiClient.instance.uploadAgentImage(file);
      if (url.isEmpty) throw ApiException('Upload failed');
      final verified = await ApiClient.instance.verifyProfilePhoto(
        url,
        autoApproved: check.ok,
      );
      setState(() {
        _profileImageUrl = url;
        if (_agent != null) {
          _agent = {
            ..._agent!,
            'profile_image_url': url,
            if (verified['profile_verified'] != null) 'profile_verified': verified['profile_verified'],
          };
        }
      });
      final msg = verified['profile_verified'] == true
          ? 'Photo verified. Save profile to apply other fields.'
          : check.error != null
              ? '${check.error} Photo submitted for review instead.'
              : 'Photo submitted for review. Save profile to apply other fields.';
      _snack(msg);
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
    }
  }

  Future<void> _saveProfile() async {
    final email = _email.text.trim();
    final profession = _profession.text.trim();
    final exact = _exactLocation.text.trim();
    final photo = _profileImageUrl?.trim() ?? '';
    if (email.isEmpty || profession.isEmpty || exact.isEmpty || photo.isEmpty) {
      _snack('Please complete all profile fields including your photo', error: true);
      return;
    }
    setState(() => _savingProfile = true);
    try {
      final data = await ApiClient.instance.updateAgentProfile(
        email: email,
        profession: profession,
        exactLocation: exact,
        profileImageUrl: photo,
      );
      if (data['agent'] is Map<String, dynamic>) {
        _applyAgent(Map<String, dynamic>.from(data['agent'] as Map));
      }
      _snack('Profile saved successfully');
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _savingProfile = false);
    }
  }

  Future<void> _changePassword() async {
    if (_newPassword.text != _confirmPassword.text) {
      _snack('New passwords do not match', error: true);
      return;
    }
    if (_newPassword.text.length < 6) {
      _snack('New password must be at least 6 characters', error: true);
      return;
    }
    setState(() => _changingPassword = true);
    try {
      await ApiClient.instance.changeAgentPassword(
        currentPassword: _currentPassword.text,
        newPassword: _newPassword.text,
      );
      _currentPassword.clear();
      _newPassword.clear();
      _confirmPassword.clear();
      _snack('Password updated successfully');
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _changingPassword = false);
    }
  }

  Future<void> _deleteAccount() async {
    final phone = _agent?['phone_number']?.toString() ?? '';
    if (_deleteConfirm.text.trim() != phone) {
      _snack('Phone number confirmation does not match', error: true);
      return;
    }
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete account?'),
        content: const Text('This permanently deactivates your agent account. Continue?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: DfColors.danger),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (ok != true) return;

    setState(() => _deleting = true);
    try {
      await ApiClient.instance.deleteAgentAccount();
      await SessionStore.instance.clear();
      if (!mounted) return;
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (_) => false,
      );
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  Future<void> _start2faSetup() async {
    setState(() => _twoFaBusy = true);
    try {
      final data = await ApiClient.instance.twoFactorSetup();
      setState(() {
        _setupSecret = data['secret']?.toString();
        _setupOtpauth = data['otpauthUrl']?.toString();
        _twoFaPending = true;
      });
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _twoFaBusy = false);
    }
  }

  Future<void> _confirm2fa() async {
    if (_totpCode.text.trim().isEmpty) {
      _snack('Enter the authenticator code', error: true);
      return;
    }
    setState(() => _twoFaBusy = true);
    try {
      final data = await ApiClient.instance.twoFactorConfirm(_totpCode.text);
      final codes = data['backupCodes'];
      setState(() {
        _twoFaEnabled = true;
        _twoFaPending = false;
        _setupSecret = null;
        _setupOtpauth = null;
        _totpCode.clear();
      });
      if (codes is List && codes.isNotEmpty && mounted) {
        await showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Save backup codes'),
            content: SingleChildScrollView(
              child: Text(codes.map((e) => e.toString()).join('\n')),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Done')),
            ],
          ),
        );
      }
      await _load2fa();
      _snack('Two-factor authentication enabled');
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _twoFaBusy = false);
    }
  }

  Future<void> _disable2fa() async {
    setState(() => _twoFaBusy = true);
    try {
      await ApiClient.instance.twoFactorDisable(
        password: _disablePassword.text.isNotEmpty ? _disablePassword.text : null,
        code: _totpCode.text.isNotEmpty ? _totpCode.text : null,
      );
      _disablePassword.clear();
      _totpCode.clear();
      await _load2fa();
      _snack('Two-factor authentication disabled');
    } on ApiException catch (e) {
      _snack(e.message, error: true);
    } catch (e) {
      _snack(e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _twoFaBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile Settings'),
        actions: [
          IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: DfColors.brand))
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(_error!, style: const TextStyle(color: DfColors.danger)),
                        const SizedBox(height: 12),
                        ElevatedButton(onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _card(
                      title: 'Complete profile',
                      child: Column(
                        children: [
                          GestureDetector(
                            onTap: _uploadingPhoto ? null : _pickPhoto,
                            child: CircleAvatar(
                              radius: 44,
                              backgroundColor: DfColors.brand.withValues(alpha: 0.15),
                              backgroundImage: _localPhoto != null
                                  ? FileImage(File(_localPhoto!.path))
                                  : (_profileImageUrl != null && _profileImageUrl!.isNotEmpty)
                                      ? NetworkImage(_profileImageUrl!) as ImageProvider
                                      : null,
                              child: _uploadingPhoto
                                  ? const CircularProgressIndicator(color: DfColors.brand)
                                  : (_profileImageUrl == null || _profileImageUrl!.isEmpty) &&
                                          _localPhoto == null
                                      ? const Icon(Icons.camera_alt, color: DfColors.brand)
                                      : null,
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextButton(
                            onPressed: _uploadingPhoto ? null : _pickPhoto,
                            child: Text(_uploadingPhoto ? 'Uploading…' : 'Upload profile photo *'),
                          ),
                          const SizedBox(height: 10),
                          TextField(controller: _email, decoration: const InputDecoration(labelText: 'Email *')),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _profession,
                            decoration: const InputDecoration(labelText: 'Profession *'),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _exactLocation,
                            decoration: const InputDecoration(labelText: 'Exact location *'),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Your profile information is used to verify your identity and is kept private. Only platform administrators can view it.',
                            style: TextStyle(fontSize: 11, color: DfColors.muted),
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: _savingProfile ? null : _saveProfile,
                            child: Text(_savingProfile ? 'Saving…' : 'Save profile'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    _card(
                      title: 'Account information',
                      child: Column(
                        children: [
                          _readonly('Full name', _agent?['full_name']?.toString() ?? '—'),
                          const SizedBox(height: 10),
                          _readonly('Phone number', _agent?['phone_number']?.toString() ?? '—'),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    _card(
                      title: 'Change password',
                      child: Column(
                        children: [
                          TextField(
                            controller: _currentPassword,
                            obscureText: !_showCurrent,
                            decoration: InputDecoration(
                              labelText: 'Current password *',
                              suffixIcon: IconButton(
                                icon: Icon(_showCurrent ? Icons.visibility_off : Icons.visibility),
                                onPressed: () => setState(() => _showCurrent = !_showCurrent),
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _newPassword,
                            obscureText: !_showNew,
                            decoration: InputDecoration(
                              labelText: 'New password * (min 6)',
                              suffixIcon: IconButton(
                                icon: Icon(_showNew ? Icons.visibility_off : Icons.visibility),
                                onPressed: () => setState(() => _showNew = !_showNew),
                              ),
                            ),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _confirmPassword,
                            obscureText: !_showConfirm,
                            decoration: InputDecoration(
                              labelText: 'Confirm new password *',
                              suffixIcon: IconButton(
                                icon: Icon(_showConfirm ? Icons.visibility_off : Icons.visibility),
                                onPressed: () => setState(() => _showConfirm = !_showConfirm),
                              ),
                            ),
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: _changingPassword ? null : _changePassword,
                            child: Text(_changingPassword ? 'Updating…' : 'Update password'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    _card(
                      title: 'Two-factor authentication',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _twoFaEnabled
                                ? 'Status: Enabled (backup codes remaining: $_backupRemaining)'
                                : _twoFaPending
                                    ? 'Status: Setup started — confirm with authenticator code'
                                    : 'Status: Disabled',
                            style: const TextStyle(fontWeight: FontWeight.w600),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Use an authenticator app (Google Authenticator, Authy) for login codes.',
                            style: TextStyle(fontSize: 12, color: DfColors.muted),
                          ),
                          if (_setupSecret != null) ...[
                            const SizedBox(height: 10),
                            SelectableText(
                              'Secret: $_setupSecret',
                              style: const TextStyle(fontSize: 12, fontFamily: 'monospace'),
                            ),
                            if (_setupOtpauth != null)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: SelectableText(
                                  _setupOtpauth!,
                                  style: const TextStyle(fontSize: 11, color: DfColors.muted),
                                ),
                              ),
                          ],
                          const SizedBox(height: 10),
                          if (!_twoFaEnabled) ...[
                            if (!_twoFaPending && _setupSecret == null)
                              OutlinedButton(
                                onPressed: _twoFaBusy ? null : _start2faSetup,
                                child: Text(_twoFaBusy ? 'Starting…' : 'Enable 2FA'),
                              ),
                            if (_twoFaPending || _setupSecret != null) ...[
                              TextField(
                                controller: _totpCode,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(labelText: 'Authenticator code'),
                              ),
                              const SizedBox(height: 8),
                              ElevatedButton(
                                onPressed: _twoFaBusy ? null : _confirm2fa,
                                child: const Text('Confirm & enable'),
                              ),
                            ],
                          ] else ...[
                            TextField(
                              controller: _disablePassword,
                              obscureText: true,
                              decoration: const InputDecoration(labelText: 'Password (to disable)'),
                            ),
                            const SizedBox(height: 8),
                            TextField(
                              controller: _totpCode,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(labelText: 'Or authenticator code'),
                            ),
                            const SizedBox(height: 8),
                            OutlinedButton(
                              onPressed: _twoFaBusy ? null : _disable2fa,
                              child: const Text('Disable 2FA'),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    _card(
                      title: 'Delete account',
                      danger: true,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Type your phone number to confirm permanent account deletion.',
                            style: TextStyle(fontSize: 12, color: DfColors.muted),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _deleteConfirm,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              labelText: 'Confirm phone (${_agent?['phone_number'] ?? ''})',
                            ),
                          ),
                          const SizedBox(height: 12),
                          ElevatedButton(
                            onPressed: _deleting ? null : _deleteAccount,
                            style: ElevatedButton.styleFrom(backgroundColor: DfColors.danger),
                            child: Text(_deleting ? 'Deleting…' : 'Delete my account'),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 28),
                  ],
                ),
    );
  }

  Widget _card({required String title, required Widget child, bool danger = false}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: danger ? DfColors.danger.withValues(alpha: 0.35) : DfColors.brand.withValues(alpha: 0.2),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            title,
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.w700,
              fontSize: 17,
              color: danger ? DfColors.danger : DfColors.ink,
            ),
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  Widget _readonly(String label, String value) {
    return InputDecorator(
      decoration: InputDecoration(labelText: label, filled: true, fillColor: const Color(0xFFF5F5F5)),
      child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
    );
  }
}
