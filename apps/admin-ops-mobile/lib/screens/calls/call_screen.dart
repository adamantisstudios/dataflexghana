import 'dart:async';
import 'package:flutter/material.dart';

import '../../services/admin_api.dart';
import '../../services/call_service.dart';
import '../../services/livekit_audio.dart';
import '../../theme.dart';
import 'call_widgets.dart';

enum _Phase { incoming, connecting, active, ended, failed }

/// Full-screen 1:1 call UI: incoming (accept/decline), then in-call with mute,
/// speaker routing, duration and hang up.
class CallScreen extends StatefulWidget {
  const CallScreen({super.key, required this.session});

  final CallSession session;

  static Future<void> open(BuildContext context, CallSession session) {
    return Navigator.of(context).push<void>(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (_) => CallScreen(session: session),
      ),
    );
  }

  @override
  State<CallScreen> createState() => _CallScreenState();
}

class _CallScreenState extends State<CallScreen> {
  final _audio = LiveKitAudio();
  final _calls = CallService.instance;

  _Phase _phase = _Phase.incoming;
  String? _message;
  bool _permissionBlocked = false;
  bool _busy = false;
  bool _leaving = false;

  Timer? _tick;
  Timer? _watch;
  StreamSubscription<void>? _remoteLeftSub;
  Duration _elapsed = Duration.zero;

  String get _sessionId => widget.session.id;

  @override
  void initState() {
    super.initState();
    _audio.addListener(_onAudioChanged);
    _remoteLeftSub = _audio.remoteLeft.listen((_) => _handleRemoteLeft());
    _calls.setHandling(true);
  }

  @override
  void dispose() {
    _tick?.cancel();
    _watch?.cancel();
    unawaited(_remoteLeftSub?.cancel());
    _audio.removeListener(_onAudioChanged);
    _audio.dispose();
    _calls.setHandling(false);
    super.dispose();
  }

  void _onAudioChanged() {
    if (mounted) setState(() {});
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  Future<void> _accept() async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _message = null;
      _permissionBlocked = false;
    });

    final permission = await LiveKitAudio.requestMicPermission();
    if (!mounted) return;
    if (permission != MediaPermissionResult.granted) {
      setState(() {
        _busy = false;
        _phase = _Phase.failed;
        _permissionBlocked = permission == MediaPermissionResult.permanentlyDenied;
        _message = _permissionBlocked
            ? 'Microphone access is blocked. Enable it in app settings to answer calls.'
            : 'Microphone permission is required to answer this call.';
      });
      return;
    }

    setState(() => _phase = _Phase.connecting);

    AcceptedCall accepted;
    try {
      accepted = await _calls.accept(_sessionId);
    } on CallGoneException catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _phase = _Phase.ended;
        _message = e.message;
      });
      return;
    } on AdminApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _phase = _Phase.failed;
        _message = e.isUnauthorized
            ? 'Your admin session has expired. Sign in again to answer calls.'
            : e.message;
      });
      return;
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _phase = _Phase.failed;
        _message = 'Could not answer the call: $e';
      });
      return;
    }

    try {
      await _audio.connect(
        serverUrl: accepted.serverUrl,
        token: accepted.token,
        publishAudio: true,
        speakerOn: false,
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _busy = false;
        _phase = _Phase.failed;
        _message = 'Call audio could not connect. $e';
      });
      // The session is active server-side, so close it out.
      unawaited(_calls.endCall(_sessionId).catchError((_) {}));
      return;
    }

    if (!mounted) return;
    setState(() {
      _busy = false;
      _phase = _Phase.active;
      _message = null;
    });
    _startTimers();
  }

  void _startTimers() {
    _tick?.cancel();
    _tick = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() => _elapsed += const Duration(seconds: 1));
    });

    // Backstop for the agent hanging up: the row leaves /api/calls/incoming.
    _watch?.cancel();
    _watch = Timer.periodic(const Duration(seconds: 4), (_) async {
      await _calls.refresh();
      if (!mounted || _phase != _Phase.active) return;
      if (_calls.isSessionGone(_sessionId)) _handleRemoteLeft();
    });
  }

  void _handleRemoteLeft() {
    if (!mounted || _leaving) return;
    if (_phase != _Phase.active) return;
    unawaited(_finish(message: 'The agent hung up.', notifyServer: false));
  }

  Future<void> _decline() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      await _calls.decline(_sessionId);
    } catch (_) {}
    if (!mounted) return;
    Navigator.of(context).maybePop();
  }

  Future<void> _hangUp() => _finish(message: 'Call ended.', notifyServer: true);

  Future<void> _finish({required String message, required bool notifyServer}) async {
    if (_leaving) return;
    _leaving = true;
    _tick?.cancel();
    _watch?.cancel();

    if (mounted) setState(() => _busy = true);

    if (notifyServer) {
      try {
        await _calls.endCall(_sessionId);
      } catch (_) {}
    }
    await _audio.disconnect();

    if (!mounted) return;
    setState(() {
      _busy = false;
      _leaving = false;
      _phase = _Phase.ended;
      _message = message;
    });
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  String get _elapsedLabel {
    final h = _elapsed.inHours;
    final m = _elapsed.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = _elapsed.inSeconds.remainder(60).toString().padLeft(2, '0');
    return h > 0 ? '$h:$m:$s' : '$m:$s';
  }

  String get _statusLabel {
    switch (_phase) {
      case _Phase.incoming:
        return 'Incoming call';
      case _Phase.connecting:
        return 'Connecting…';
      case _Phase.active:
        if (_audio.isReconnecting) return 'Reconnecting…';
        return _elapsedLabel;
      case _Phase.ended:
        return 'Call ended';
      case _Phase.failed:
        return 'Call failed';
    }
  }

  @override
  Widget build(BuildContext context) {
    final inCall = _phase == _Phase.connecting || _phase == _Phase.active;

    return PopScope(
      canPop: !inCall,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && _phase == _Phase.active) unawaited(_hangUp());
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF060C17),
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 28),
                Text(
                  _statusLabel.toUpperCase(),
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                    letterSpacing: 2.4,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const Spacer(),
                CallAvatar(
                  name: widget.session.displayName,
                  pulsing: _phase == _Phase.incoming,
                  speaking: _phase == _Phase.active && _audio.remoteSpeaking,
                ),
                const SizedBox(height: 26),
                Text(
                  widget.session.displayName,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                if (widget.session.callerPhone.isNotEmpty) ...[
                  const SizedBox(height: 6),
                  Text(
                    widget.session.callerPhone,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white54, fontSize: 15),
                  ),
                ],
                if (_phase == _Phase.active) ...[
                  const SizedBox(height: 10),
                  Text(
                    _elapsedLabel,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      color: OpsColors.success,
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      fontFeatures: [FontFeature.tabularFigures()],
                    ),
                  ),
                ],
                if (_message != null) ...[
                  const SizedBox(height: 18),
                  Text(
                    _message!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.4),
                  ),
                ],
                if (_audio.error != null && _phase == _Phase.active) ...[
                  const SizedBox(height: 12),
                  Text(
                    _audio.error!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: OpsColors.danger, fontSize: 13),
                  ),
                ],
                const Spacer(),
                _controls(),
                const SizedBox(height: 34),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _controls() {
    switch (_phase) {
      case _Phase.incoming:
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            CallActionButton(
              icon: Icons.call_end_rounded,
              label: 'Decline',
              color: OpsColors.danger,
              busy: _busy,
              onPressed: _busy ? null : _decline,
            ),
            CallActionButton(
              icon: Icons.call_rounded,
              label: 'Accept',
              color: OpsColors.success,
              busy: _busy,
              onPressed: _busy ? null : _accept,
            ),
          ],
        );

      case _Phase.connecting:
        return const Center(
          child: SizedBox(
            width: 28,
            height: 28,
            child: CircularProgressIndicator(strokeWidth: 2.5, color: OpsColors.brand),
          ),
        );

      case _Phase.active:
        return Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            CallToggleButton(
              icon: _audio.micEnabled ? Icons.mic_rounded : Icons.mic_off_rounded,
              label: _audio.micEnabled ? 'Mute' : 'Unmute',
              active: !_audio.micEnabled,
              onPressed: _audio.isConnected ? () => _audio.toggleMicrophone() : null,
            ),
            CallActionButton(
              icon: Icons.call_end_rounded,
              label: 'End',
              color: OpsColors.danger,
              busy: _busy,
              onPressed: _busy ? null : _hangUp,
            ),
            CallToggleButton(
              icon: _audio.speakerOn ? Icons.volume_up_rounded : Icons.hearing_rounded,
              label: _audio.speakerOn ? 'Speaker' : 'Earpiece',
              active: _audio.speakerOn,
              onPressed: _audio.isConnected ? () => _audio.toggleSpeaker() : null,
            ),
          ],
        );

      case _Phase.ended:
      case _Phase.failed:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (_permissionBlocked) ...[
              OutlinedButton.icon(
                onPressed: () => _audio.openPermissionSettings(),
                icon: const Icon(Icons.settings_rounded),
                label: const Text('Open app settings'),
              ),
              const SizedBox(height: 10),
            ],
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                style: FilledButton.styleFrom(
                  backgroundColor: OpsColors.card,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onPressed: () => Navigator.of(context).maybePop(),
                child: const Text('Close'),
              ),
            ),
          ],
        );
    }
  }
}
