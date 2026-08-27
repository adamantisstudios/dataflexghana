import 'dart:async';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../services/api_client.dart';
import '../services/conference_api.dart';
import '../services/livekit_service.dart';
import 'conference/conference_theme.dart';

enum _CallPhase { checking, unavailable, ringing, active, ended, failed }

/// 1:1 audio call from an agent to the support admin. The agent joins the
/// LiveKit room immediately after initiating and waits there while the session
/// status is polled; the admin joins once they accept.
class AdminCallScreen extends StatefulWidget {
  const AdminCallScreen({super.key});

  @override
  State<AdminCallScreen> createState() => _AdminCallScreenState();
}

class _AdminCallScreenState extends State<AdminCallScreen> {
  final _service = LiveKitService();

  _CallPhase _phase = _CallPhase.checking;
  String? _message;
  String? _sessionId;
  Timer? _statusPoll;
  Timer? _timer;
  Duration _elapsed = Duration.zero;
  bool _ending = false;

  @override
  void initState() {
    super.initState();
    _service.addListener(_onServiceChanged);
    _start();
  }

  @override
  void dispose() {
    _statusPoll?.cancel();
    _timer?.cancel();
    _service.removeListener(_onServiceChanged);
    _service.dispose();
    super.dispose();
  }

  void _onServiceChanged() {
    if (mounted) setState(() {});
  }

  Future<void> _start() async {
    setState(() {
      _phase = _CallPhase.checking;
      _message = null;
    });

    final permission = await _service.requestMediaPermissions();
    if (permission != MediaPermissionResult.granted) {
      if (!mounted) return;
      setState(() {
        _phase = _CallPhase.failed;
        _message = permission == MediaPermissionResult.permanentlyDenied
            ? 'Microphone access is blocked. Enable it in app settings to call support.'
            : 'Microphone permission is required to place a call.';
      });
      return;
    }

    try {
      final availability = await ConferenceApi.instance.callAvailability();
      if (availability['available'] != true) {
        if (!mounted) return;
        setState(() {
          _phase = _CallPhase.unavailable;
          _message = 'Support is on another call right now. Please try again shortly.';
        });
        return;
      }
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _phase = _CallPhase.failed;
        _message = e.message;
      });
      return;
    }

    await _initiate();
  }

  Future<void> _initiate() async {
    try {
      final data = await ConferenceApi.instance.initiateCall();
      final sessionId = data['sessionId']?.toString();
      final token = data['token']?.toString();
      final serverUrl = data['serverUrl']?.toString();
      if (sessionId == null || token == null || serverUrl == null) {
        throw ApiException('Call could not be set up');
      }

      _sessionId = sessionId;
      if (mounted) {
        setState(() {
          _phase = _CallPhase.ringing;
          _message = null;
        });
      }

      await _service.connect(
        serverUrl: serverUrl,
        token: token,
        publishAudio: true,
        speakerOn: false,
      );

      _statusPoll = Timer.periodic(const Duration(seconds: 3), (_) => _pollStatus());
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _phase = e.statusCode == 409 ? _CallPhase.unavailable : _CallPhase.failed;
        _message = e.message;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _phase = _CallPhase.failed;
        _message = e.toString();
      });
    }
  }

  Future<void> _pollStatus() async {
    final sessionId = _sessionId;
    if (sessionId == null) return;
    try {
      final data = await ConferenceApi.instance.callStatus(sessionId);
      final session = data['session'];
      final status = session is Map ? session['status']?.toString() : null;
      if (!mounted) return;

      switch (status) {
        case 'active':
          if (_phase != _CallPhase.active) {
            setState(() => _phase = _CallPhase.active);
            _timer ??= Timer.periodic(const Duration(seconds: 1), (_) {
              if (mounted) setState(() => _elapsed += const Duration(seconds: 1));
            });
          }
          break;
        case 'declined':
          _statusPoll?.cancel();
          await _service.disconnect();
          if (mounted) {
            setState(() {
              _phase = _CallPhase.ended;
              _message = 'Support declined the call.';
            });
          }
          break;
        case 'ended':
          _statusPoll?.cancel();
          _timer?.cancel();
          await _service.disconnect();
          if (mounted) {
            setState(() {
              _phase = _CallPhase.ended;
              _message = 'Call ended.';
            });
          }
          break;
      }
    } catch (_) {
      // Transient polling failures are ignored; the next tick retries.
    }
  }

  Future<void> _endCall({bool pop = true}) async {
    if (_ending) return;
    setState(() => _ending = true);
    _statusPoll?.cancel();
    _timer?.cancel();

    final sessionId = _sessionId;
    if (sessionId != null) {
      try {
        await ConferenceApi.instance.endCall(sessionId);
      } catch (_) {}
    }
    await _service.disconnect();

    if (!mounted) return;
    if (pop) {
      Navigator.of(context).pop();
    } else {
      setState(() {
        _ending = false;
        _phase = _CallPhase.ended;
        _message = 'Call ended.';
      });
    }
  }

  String get _elapsedLabel {
    final minutes = _elapsed.inMinutes.remainder(60).toString().padLeft(2, '0');
    final seconds = _elapsed.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  String get _statusLabel {
    switch (_phase) {
      case _CallPhase.checking:
        return 'Checking availability…';
      case _CallPhase.ringing:
        return 'Ringing support…';
      case _CallPhase.active:
        return _elapsedLabel;
      case _CallPhase.unavailable:
        return 'Support is busy';
      case _CallPhase.ended:
        return 'Call ended';
      case _CallPhase.failed:
        return 'Call failed';
    }
  }

  @override
  Widget build(BuildContext context) {
    final inCall = _phase == _CallPhase.ringing || _phase == _CallPhase.active;

    return PopScope(
      canPop: !inCall,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _endCall();
      },
      child: Scaffold(
        backgroundColor: StageColors.backdrop,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              children: [
                const SizedBox(height: 22),
                Align(
                  alignment: Alignment.centerLeft,
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back_rounded, color: StageColors.text),
                    onPressed: () => inCall ? _endCall() : Navigator.of(context).pop(),
                  ),
                ),
                const Spacer(),
                _Pulse(active: _phase == _CallPhase.ringing),
                const SizedBox(height: 26),
                Text(
                  'DataFlex Support',
                  style: GoogleFonts.outfit(
                    color: StageColors.text,
                    fontSize: 24,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _statusLabel,
                  style: const TextStyle(color: StageColors.textMuted, fontSize: 15),
                ),
                if (_message != null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _message!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: StageColors.textMuted, fontSize: 13.5),
                  ),
                ],
                const Spacer(),
                if (inCall)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      StageControlButton(
                        icon: _service.micEnabled ? Icons.mic_rounded : Icons.mic_off_rounded,
                        label: _service.micEnabled ? 'Mute' : 'Unmute',
                        active: _service.micEnabled,
                        onPressed: _service.isConnected ? _service.toggleMicrophone : null,
                      ),
                      const SizedBox(width: 20),
                      StageControlButton(
                        icon: _service.speakerOn ? Icons.volume_up_rounded : Icons.hearing_rounded,
                        label: _service.speakerOn ? 'Speaker' : 'Earpiece',
                        active: _service.speakerOn,
                        onPressed: _service.isConnected ? _service.toggleSpeaker : null,
                      ),
                      const SizedBox(width: 20),
                      StageControlButton(
                        icon: Icons.call_end_rounded,
                        label: 'End',
                        danger: true,
                        busy: _ending,
                        onPressed: () => _endCall(),
                      ),
                    ],
                  )
                else if (_phase == _CallPhase.checking)
                  const CircularProgressIndicator(color: StageColors.accent)
                else
                  Column(
                    children: [
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(backgroundColor: StageColors.accentSoft),
                          onPressed: _start,
                          icon: const Icon(Icons.call_rounded),
                          label: const Text('Call again'),
                        ),
                      ),
                      const SizedBox(height: 10),
                      TextButton(
                        onPressed: () => Navigator.of(context).pop(),
                        child: const Text(
                          'Close',
                          style: TextStyle(color: StageColors.textMuted),
                        ),
                      ),
                    ],
                  ),
                const SizedBox(height: 26),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _Pulse extends StatefulWidget {
  const _Pulse({required this.active});

  final bool active;

  @override
  State<_Pulse> createState() => _PulseState();
}

class _PulseState extends State<_Pulse> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1400),
  );

  @override
  void initState() {
    super.initState();
    if (widget.active) _controller.repeat(reverse: true);
  }

  @override
  void didUpdateWidget(covariant _Pulse oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.active && !_controller.isAnimating) {
      _controller.repeat(reverse: true);
    } else if (!widget.active && _controller.isAnimating) {
      _controller.stop();
      _controller.value = 0;
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final scale = 1 + 0.12 * _controller.value;
        return Transform.scale(scale: scale, child: child);
      },
      child: Container(
        width: 132,
        height: 132,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            colors: [StageColors.accent, StageColors.accentSoft],
          ),
          boxShadow: [
            BoxShadow(
              color: StageColors.accent.withValues(alpha: 0.35),
              blurRadius: 34,
              spreadRadius: 4,
            ),
          ],
        ),
        child: const Center(
          child: Icon(Icons.support_agent_rounded, size: 58, color: Color(0xFF04170B)),
        ),
      ),
    );
  }
}
