import 'dart:async';

import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/biodata.dart';
import '../widgets/cards.dart';
import '../widgets/common.dart';

/// One conversation. New messages arrive every few seconds, like the website's chat.
class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key, required this.id});
  final int id;

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> with WidgetsBindingObserver {
  final List<Json> messages = [];
  final text = TextEditingController();
  final scroll = ScrollController();
  Timer? timer;
  Json? info;
  Object? error;
  bool sending = false;
  bool active = true;

  int get lastId => messages.isEmpty ? 0 : (messages.last['id'] as num).toInt();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _poll(first: true);
    timer = Timer.periodic(const Duration(seconds: 4), (_) {
      if (active) _poll();
    });
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) => active = state == AppLifecycleState.resumed;

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    timer?.cancel();
    super.dispose();
  }

  Future<void> _poll({bool first = false}) async {
    try {
      final data = await app.api.get('chat/${widget.id}', {'after': '$lastId'});
      if (!mounted) return;
      final incoming = rowsOf(data['messages']);
      final known = messages.map((message) => message['id']).toSet();
      setState(() {
        info = data;
        error = null;
        messages.addAll(incoming.where((message) => !known.contains(message['id'])));
      });
      if (incoming.isNotEmpty) _toBottom();
      if (first) app.refreshAccount();
    } catch (caught) {
      // A missed poll is harmless: the next one catches up.
      if (first && mounted) setState(() => error = caught);
    }
  }

  void _toBottom() => WidgetsBinding.instance.addPostFrameCallback((_) {
        if (scroll.hasClients) scroll.animateTo(scroll.position.maxScrollExtent, duration: const Duration(milliseconds: 250), curve: Curves.easeOut);
      });

  Future<void> _send() async {
    final body = text.text.trim();
    if (body.isEmpty || sending) return;
    setState(() => sending = true);
    try {
      final result = await app.api.post('chat/${widget.id}', {'body': body});
      text.clear();
      setState(() => messages.add((result['message'] as Map).cast<String, dynamic>()));
      _toBottom();
    } on ApiException catch (caught) {
      if (!mounted) return;
      if (caught.upgrade) {
        showUnlockSheet(context);
      } else {
        showMessage(context, caught.message, error: true);
      }
    } finally {
      if (mounted) setState(() => sending = false);
    }
  }

  Future<void> _toggleBlock() async {
    final blocked = info?['blockedByMe'] == true;
    try {
      final result = await app.api.post('chat/${widget.id}/block', {'blocked': !blocked});
      setState(() => info = {...?info, 'blockedByMe': result['blockedByMe']});
      _poll();
    } on ApiException catch (caught) {
      if (mounted) showMessage(context, caught.message, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final me = info?['me'];
    final blocked = info?['blocked'] as String?;
    return Scaffold(
      backgroundColor: AppColors.paper,
      appBar: AppBar(
        title: Text(info == null ? tr('Messages') : '${info!['otherName']}'),
        actions: [
          if (info != null) TextButton(onPressed: _toggleBlock, child: Text(tr(info!['blockedByMe'] == true ? 'Unblock' : 'Block'), style: const TextStyle(color: AppColors.champagne))),
        ],
      ),
      body: error != null && info == null
          ? ErrorView(error!, onRetry: () { setState(() => error = null); _poll(first: true); })
          : info == null
              ? const LoadingView()
              : Column(children: [
                  Expanded(
                    child: messages.isEmpty
                        ? Center(child: Text(tr('Say salaam to begin the conversation.'), style: const TextStyle(color: AppColors.muted)))
                        : ListView.builder(
                            controller: scroll,
                            padding: const EdgeInsets.all(14),
                            itemCount: messages.length,
                            itemBuilder: (context, index) {
                              final message = messages[index];
                              final mine = message['sender_id'] == me;
                              return Align(
                                alignment: mine ? AlignmentDirectional.centerEnd : AlignmentDirectional.centerStart,
                                child: Container(
                                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                                  margin: const EdgeInsets.only(bottom: 10),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                  decoration: BoxDecoration(
                                    color: mine ? AppColors.navy : Colors.white,
                                    border: mine ? null : Border.all(color: AppColors.line),
                                    borderRadius: BorderRadiusDirectional.only(topStart: const Radius.circular(14), topEnd: const Radius.circular(14), bottomStart: Radius.circular(mine ? 14 : 3), bottomEnd: Radius.circular(mine ? 3 : 14)),
                                  ),
                                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Tx('${message['body']}', style: TextStyle(fontSize: 14.5, height: 1.45, color: mine ? Colors.white : AppColors.navy)),
                                    const SizedBox(height: 4),
                                    Text('${formatDate(message['created_at'], time: true)}${mine && message['read_at'] != null ? tr(' · Read') : ''}', style: TextStyle(fontSize: 10, color: mine ? const Color(0xFFC1CDD6) : AppColors.muted)),
                                  ]),
                                ),
                              );
                            },
                          ),
                  ),
                  SafeArea(
                    top: false,
                    child: blocked != null
                        ? Container(
                            width: double.infinity,
                            color: AppColors.goldBg,
                            padding: const EdgeInsets.all(14),
                            child: Column(children: [
                              Tx(tr(blocked), textAlign: TextAlign.center, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.goldText)),
                              if (info?['upgrade'] == true) TextButton(onPressed: () => showUnlockSheet(context), child: Text(tr('Unlock Full Profile Access'))),
                            ]),
                          )
                        : Container(
                            color: Colors.white,
                            padding: const EdgeInsetsDirectional.fromSTEB(12, 8, 8, 8),
                            child: Row(children: [
                              Expanded(
                                child: TextField(
                                  controller: text,
                                  maxLength: 1000,
                                  minLines: 1,
                                  maxLines: 4,
                                  textCapitalization: TextCapitalization.sentences,
                                  decoration: InputDecoration(hintText: tr('Write a message…'), counterText: ''),
                                ),
                              ),
                              const SizedBox(width: 8),
                              IconButton.filled(
                                style: IconButton.styleFrom(backgroundColor: AppColors.navy, foregroundColor: Colors.white, minimumSize: const Size(48, 48)),
                                tooltip: tr('Send message'),
                                onPressed: sending ? null : _send,
                                icon: sending ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.send_rounded),
                              ),
                            ]),
                          ),
                  ),
                ]),
    );
  }
}
