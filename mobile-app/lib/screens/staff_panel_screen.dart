import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:webview_flutter_android/webview_flutter_android.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/common.dart';

/// The website's admin or consultant panel, inside the app. The app asks the server for a
/// one-minute sign-in link tied to this phone's session, so the team never types a password twice
/// and every admin tool works exactly as on the website.
class StaffPanelScreen extends StatefulWidget {
  const StaffPanelScreen({super.key, this.path, this.title});
  final String? path;
  final String? title;

  @override
  State<StaffPanelScreen> createState() => _StaffPanelScreenState();
}

class _StaffPanelScreenState extends State<StaffPanelScreen> {
  WebViewController? controller;
  int progress = 0;
  String? error;
  String? pageTitle;

  String get _panel => app.user?['role'] == 'admin' ? '/admin' : '/consultant';

  @override
  void initState() {
    super.initState();
    _open();
  }

  Future<void> _open() async {
    setState(() => error = null);
    try {
      final link = await app.api.post('staff/web-link', {'next': widget.path ?? _panel});
      final host = Uri.parse(app.api.base).host;
      final web = WebViewController()
        ..setJavaScriptMode(JavaScriptMode.unrestricted)
        ..setBackgroundColor(AppColors.paper)
        ..setNavigationDelegate(NavigationDelegate(
          onProgress: (value) => mounted ? setState(() => progress = value) : null,
          onPageFinished: (_) async {
            final title = await controller?.getTitle();
            if (mounted) setState(() => pageTitle = title?.split('|').first.trim());
          },
          onWebResourceError: (failure) {
            if (failure.isForMainFrame == true && mounted) setState(() => error = 'This page could not be opened. Check your connection and try again.');
          },
          onNavigationRequest: (request) {
            final uri = Uri.tryParse(request.url);
            // The website stays inside the app; WhatsApp, phone, email and other sites open outside it.
            if (uri != null && (uri.scheme == 'http' || uri.scheme == 'https') && uri.host == host) return NavigationDecision.navigate;
            if (uri != null && uri.scheme == 'about') return NavigationDecision.navigate;
            openLink(context, request.url);
            return NavigationDecision.prevent;
          },
        ));
      final platform = web.platform;
      if (platform is AndroidWebViewController) {
        // File inputs on the panel (photos, QR codes, receipts) open the phone's gallery.
        await platform.setOnShowFileSelector((params) async {
          final picker = ImagePicker();
          if (params.mode == FileSelectorMode.openMultiple) {
            final files = await picker.pickMultiImage(imageQuality: 90);
            return files.map((file) => File(file.path).uri.toString()).toList();
          }
          final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 90);
          return file == null ? <String>[] : [File(file.path).uri.toString()];
        });
      }
      await web.loadRequest(Uri.parse(app.api.absolute('${link['url']}')));
      if (mounted) setState(() => controller = web);
    } on ApiException catch (failure) {
      if (mounted) setState(() => error = failure.message);
    }
  }

  Future<bool> _back() async {
    final web = controller;
    if (web != null && await web.canGoBack()) {
      await web.goBack();
      return false;
    }
    return true;
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        final navigator = Navigator.of(context);
        if (await _back()) navigator.pop();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(pageTitle ?? tr(widget.title ?? (app.user?['role'] == 'admin' ? 'Admin panel' : 'Consultant panel')), maxLines: 1, overflow: TextOverflow.ellipsis),
          actions: [
            IconButton(tooltip: tr('Refresh'), icon: const Icon(Icons.refresh_rounded), onPressed: () => controller == null ? _open() : controller!.reload()),
            IconButton(tooltip: tr('Close'), icon: const Icon(Icons.close_rounded), onPressed: () => Navigator.of(context).pop()),
          ],
          bottom: progress > 0 && progress < 100 ? PreferredSize(preferredSize: const Size.fromHeight(3), child: LinearProgressIndicator(value: progress / 100, minHeight: 3, backgroundColor: AppColors.navy)) : null,
        ),
        body: error != null
            ? EmptyState(icon: Icons.wifi_off_rounded, title: 'Could not open the panel', text: error!, action: AppButton('Try again', tone: Tone.gold, onPressed: _open))
            : controller == null
                ? const Center(child: CircularProgressIndicator())
                : WebViewWidget(controller: controller!),
      ),
    );
  }
}

/// The admin home in the app: what is waiting today, and every section of the website's admin panel.
class AdminHome extends StatelessWidget {
  const AdminHome({super.key});

  static const sections = <(String, List<(IconData, String, String)>)>[
    ('Proposals', [
      (Icons.badge_rounded, 'Profiles', '/admin/profiles'),
      (Icons.verified_rounded, 'Blue tick requests', '/admin/verification'),
      (Icons.star_rounded, 'Homepage proposals', '/admin/featured'),
      (Icons.person_add_alt_1_rounded, 'Add a profile', '/admin/profiles/new'),
    ]),
    ('People', [
      (Icons.manage_accounts_rounded, 'User management', '/admin/users'),
      (Icons.support_agent_rounded, 'Consultants', '/admin/consultants'),
      (Icons.forum_rounded, 'Chat and messages', '/admin/chat'),
      (Icons.mark_email_unread_rounded, 'Enquiries', '/admin/enquiries'),
    ]),
    ('Payments', [
      (Icons.receipt_long_rounded, 'Payment Requests', '/admin/payment-requests'),
      (Icons.account_balance_rounded, 'Payment Methods', '/admin/payment-methods'),
      (Icons.lock_rounded, 'Restrictions', '/admin/restrictions'),
      (Icons.workspace_premium_rounded, 'Paid Users', '/admin/paid-users'),
      (Icons.history_rounded, 'Payment History', '/admin/payment-history'),
    ]),
    ('Premium credits', [
      (Icons.inventory_2_rounded, 'Premium Profile Packages', '/admin/packages'),
      (Icons.toll_rounded, 'Credits and unlocks', '/admin/credits'),
      (Icons.request_quote_rounded, 'Consultancy fees', '/admin/fees'),
    ]),
    ('Website', [
      (Icons.web_rounded, 'Website content', '/admin/content'),
      (Icons.quiz_rounded, 'FAQs', '/admin/faqs'),
      (Icons.category_rounded, 'Categories', '/admin/categories'),
      (Icons.public_rounded, 'Countries and cities', '/admin/locations'),
      (Icons.groups_rounded, 'Castes / Biradari', '/admin/castes'),
    ]),
    ('Settings', [
      (Icons.tune_rounded, 'Matching rules', '/admin/matching'),
      (Icons.email_rounded, 'Email messages', '/admin/emails'),
      (Icons.dns_rounded, 'Email server', '/admin/smtp'),
      (Icons.timeline_rounded, 'Activity log', '/admin/activity'),
    ]),
  ];

  @override
  Widget build(BuildContext context) {
    void open(String path, String title) => push(context, StaffPanelScreen(path: path, title: title));
    return Loader(
      padding: EdgeInsets.zero,
      scroll: false,
      load: () => app.api.get('admin/summary'),
      builder: (context, data, reload) {
        int count(String key) => (data[key] as num?)?.toInt() ?? 0;
        final waiting = [
          (Icons.hourglass_top_rounded, 'Profiles to review', count('pendingProfiles'), '/admin/profiles?status=pending'),
          (Icons.receipt_long_rounded, 'Payments to check', count('payments'), '/admin/payment-requests'),
          (Icons.verified_rounded, 'Blue tick requests', count('verification'), '/admin/verification'),
          (Icons.mark_email_unread_rounded, 'New enquiries', count('enquiries'), '/admin/enquiries'),
        ];
        return RefreshIndicator(
          onRefresh: reload,
          child: ListView(padding: EdgeInsets.zero, children: [
            Container(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 26),
              decoration: const BoxDecoration(
                gradient: LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [AppColors.navy, AppColors.dark]),
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(tr('Admin dashboard').toUpperCase(), style: const TextStyle(color: AppColors.goldSoft, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.4)),
                const SizedBox(height: 4),
                Text(tr('Welcome back, {name}', {'name': '${app.user?['name'] ?? ''}'.split(' ').first}), style: const TextStyle(color: Colors.white, fontFamily: 'Playfair', fontSize: 26, fontVariations: [FontVariation('wght', 600)])),
                const SizedBox(height: 4),
                Text(tr('{profiles} live profiles · {members} members', {'profiles': count('profiles'), 'members': count('members')}), style: const TextStyle(color: Color(0xFFC7D3DD), fontSize: 13)),
                const SizedBox(height: 18),
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 1.75,
                  children: [
                    for (final (icon, label, value, path) in waiting)
                      Material(
                        color: Colors.white.withValues(alpha: 0.08),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: BorderSide(color: value > 0 ? AppColors.goldSoft.withValues(alpha: 0.7) : Colors.white24)),
                        child: InkWell(
                          borderRadius: BorderRadius.circular(16),
                          onTap: () => open(path, label),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                              Row(children: [
                                Icon(icon, size: 18, color: AppColors.goldSoft),
                                const Spacer(),
                                Text('$value', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w700)),
                              ]),
                              Text(tr(label), maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.white, fontSize: 12.5, fontWeight: FontWeight.w500)),
                            ]),
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 14),
                AppButton('Open the full admin panel', tone: Tone.gold, expand: true, icon: Icons.dashboard_customize_rounded, onPressed: () => open('/admin', 'Admin panel')),
              ]),
            ),
            for (final (group, items) in sections)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Padding(padding: const EdgeInsetsDirectional.only(start: 4, bottom: 8), child: Text(tr(group).toUpperCase(), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: AppColors.bronze))),
                  Panel(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Column(children: [
                      for (var i = 0; i < items.length; i++) ...[
                        ListTile(
                          leading: Container(width: 36, height: 36, decoration: const BoxDecoration(color: AppColors.cream, shape: BoxShape.circle), child: Icon(items[i].$1, size: 18, color: AppColors.gold)),
                          title: Text(tr(items[i].$2), style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w500)),
                          trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                            if (_badge(items[i].$3, count) > 0) Badge(label: Text('${_badge(items[i].$3, count)}'), backgroundColor: AppColors.gold, textColor: AppColors.dark),
                            const SizedBox(width: 6),
                            const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
                          ]),
                          onTap: () => open(items[i].$3, items[i].$2),
                        ),
                        if (i < items.length - 1) const Divider(indent: 68),
                      ],
                    ]),
                  ),
                ]),
              ),
            const SizedBox(height: 24),
          ]),
        );
      },
    );
  }

  static int _badge(String path, int Function(String) count) => switch (path) {
        '/admin/profiles' => count('pendingProfiles'),
        '/admin/verification' => count('verification'),
        '/admin/payment-requests' => count('payments'),
        '/admin/enquiries' => count('enquiries'),
        _ => 0,
      };
}
