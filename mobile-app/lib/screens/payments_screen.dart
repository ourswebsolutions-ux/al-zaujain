import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/biodata.dart';
import '../widgets/common.dart';
import '../widgets/pickers.dart';

/// 25000 → "25,000", as the website writes rupees.
String money(Object? value) {
  final number = (value is num ? value : num.tryParse('$value') ?? 0).round().toString();
  return number.replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ',');
}

Widget paymentStatusPill(String status) => switch (status) {
      'approved' => Pill('Approved', color: Color(0xFF1F8A3A), background: Color(0x1A28A745)),
      'rejected' => Pill('Rejected', color: Color(0xFFC02E3C), background: Color(0x1ADC3545)),
      _ => Pill('Pending', color: Color(0xFF946C13), background: Color(0x2BE4B653)),
    };

/// My Payment Status, Payment History and Unlocked Profile Access, as on the website's dashboard.
class PaymentsScreen extends StatelessWidget {
  const PaymentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr('My Payment Status'))),
      body: Loader(
        load: () => app.api.get('payments'),
        builder: (context, data, reload) {
          final state = '${data['state']}';
          final pending = data['pending'] == true;
          final active = state == 'active';
          final (IconData icon, Color color, String title, String text) = active
              ? (Icons.check_circle_rounded, const Color(0xFF1F8A3A), 'Your access is active', data['expiresAt'] == null ? tr('Your access does not expire.') : tr('Your access runs until {date}.', {'date': formatDate(data['expiresAt'])}))
              : pending
                  ? (Icons.schedule_rounded, const Color(0xFF946C13), 'Your payment is being reviewed', tr('Our team will check it shortly. You do not need to pay again.'))
                  : state == 'expired'
                      ? (Icons.lock_rounded, AppColors.red, 'Your access has expired', tr('Submit a new payment to continue.'))
                      : (Icons.lock_rounded, AppColors.muted, 'You do not have full access yet', tr('Make a payment to unlock complete profiles.'));
          final requests = rowsOf(data['requests']);
          final access = rowsOf(data['access']);
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
            const PageIntro('My Payment Status', text: 'Your full profile access and payments.'),
            Panel(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Icon(icon, color: color, size: 28),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(tr(title), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Tx(text, style: const TextStyle(fontSize: 13, color: AppColors.muted)),
                  ])),
                ]),
                if (!active && !pending && data['staff'] != true) ...[
                  const SizedBox(height: 14),
                  AppButton('View Payment Options', tone: Tone.gold, icon: Icons.account_balance_wallet_rounded, onPressed: () async {
                    await push(context, const PaymentSubmitScreen());
                    reload();
                  }),
                ],
              ]),
            ),
            const SizedBox(height: 14),
            Panel(
              title: 'Unlocked Profile Access',
              child: Column(children: [
                Tx(tr('What you can see on matrimonial profiles.'), style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
                const SizedBox(height: 6),
                for (final item in access)
                  Container(
                    padding: const EdgeInsets.symmetric(vertical: 11),
                    decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFEEF0F3)))),
                    child: Row(children: [
                      Expanded(child: Text(tr('${item['label']}'), style: const TextStyle(fontSize: 14))),
                      Icon(item['open'] == true ? Icons.lock_open_rounded : Icons.lock_rounded, size: 14, color: item['open'] == true ? const Color(0xFF1F8A3A) : const Color(0xFF946C13)),
                      const SizedBox(width: 4),
                      Text(tr(item['open'] == true ? 'Unlocked' : 'Locked'), style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: item['open'] == true ? const Color(0xFF1F8A3A) : const Color(0xFF946C13))),
                    ]),
                  ),
              ]),
            ),
            const SizedBox(height: 14),
            Panel(
              title: 'Payment History',
              child: requests.isEmpty
                  ? Padding(padding: const EdgeInsets.all(12), child: Text(tr('Your payments will appear here.'), textAlign: TextAlign.center, style: const TextStyle(color: AppColors.muted)))
                  : Column(children: [
                      for (final request in requests)
                        Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFEEF0F3)))),
                          child: Row(children: [
                            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Text('${request['method']} · ${request['amount']}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                              Text('${request['transactionId']} · ${formatDate(request['createdAt'])}', style: const TextStyle(fontSize: 12, color: AppColors.muted)),
                            ])),
                            paymentStatusPill('${request['status']}'),
                            IconButton(tooltip: tr('Receipt'), icon: const Icon(Icons.receipt_long_rounded, size: 20), onPressed: () => push(context, _Receipt(path: '${request['receipt']}'))),
                          ]),
                        ),
                    ]),
            ),
          ]);
        },
      ),
    );
  }
}

class _Receipt extends StatelessWidget {
  const _Receipt({required this.path});
  final String path;
  @override
  Widget build(BuildContext context) => Scaffold(appBar: AppBar(title: Text(tr('Receipt'))), body: InteractiveViewer(child: Center(child: NetImage(path, fit: BoxFit.contain))));
}

/// Submit Payment: choose a method, pay into the account shown, then send the details and receipt.
/// With [pack] the payment buys a premium credit package; the credits are added when the bureau approves it.
class PaymentSubmitScreen extends StatelessWidget {
  const PaymentSubmitScreen({super.key, this.pack});
  final Json? pack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(tr('Submit Payment'))),
      body: Loader(
        load: () => app.api.get('payments'),
        builder: (context, data, reload) {
          const intro = PageIntro('Submit Payment', text: 'Choose a payment method, send your payment, then tell us about it here.');
          if (pack != null && data['pendingCredits'] == true) return const Column(children: [intro, EmptyState(icon: Icons.schedule_rounded, title: 'Your credit purchase is being reviewed', text: 'Our team will check it shortly. The credits are added as soon as it is approved.')]);
          if (pack == null && data['state'] == 'active') return const Column(children: [intro, EmptyState(icon: Icons.check_circle_rounded, title: 'Your access is active', text: 'You do not need to pay again.')]);
          if (pack == null && data['pending'] == true) return const Column(children: [intro, EmptyState(icon: Icons.schedule_rounded, title: 'Your payment is being reviewed', text: 'Our team will check it shortly. You do not need to pay again.')]);
          final methods = rowsOf(data['methods']);
          if (methods.isEmpty) return const Column(children: [intro, EmptyState(icon: Icons.account_balance_wallet_rounded, title: 'Payment options are not available yet', text: 'Please contact our team.')]);
          return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [intro, _PaymentForm(methods: methods, price: data['price'] as String?, pack: pack)]);
        },
      ),
    );
  }
}

class _PaymentForm extends StatefulWidget {
  const _PaymentForm({required this.methods, this.price, this.pack});
  final Json? pack;
  final List<Json> methods;
  final String? price;
  @override
  State<_PaymentForm> createState() => _PaymentFormState();
}

class _PaymentFormState extends State<_PaymentForm> {
  late int methodId = (widget.methods.first['id'] as num).toInt();
  final sender = TextEditingController();
  final transaction = TextEditingController();
  late final amount = TextEditingController(text: widget.pack == null ? '' : '${(widget.pack!['price'] as num).round()}');
  XFile? receipt;
  Uint8List? receiptBytes;
  bool busy = false;
  String? error;

  Json get method => widget.methods.firstWhere((item) => item['id'] == methodId);

  Widget _copyRow(String label, Object? value) {
    if (value == null || '$value'.isEmpty) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFEEF0F3)))),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(tr(label), style: const TextStyle(fontSize: 11.5, color: AppColors.muted)),
          Text('$value', textDirection: TextDirection.ltr, style: const TextStyle(fontSize: 14.5, fontWeight: FontWeight.w600, letterSpacing: 0.4)),
        ])),
        TextButton.icon(onPressed: () => copyText(context, '$value', 'Copied'), icon: const Icon(Icons.copy_rounded, size: 15), label: Text(tr('Copy'))),
      ]),
    );
  }

  Future<void> _submit() async {
    setState(() { busy = true; error = null; });
    try {
      await app.api.multipart('payments', [
        MapEntry('method_id', '$methodId'),
        if (widget.pack != null) MapEntry('package_id', '${widget.pack!['id']}'),
        MapEntry('sender_name', sender.text),
        MapEntry('transaction_id', transaction.text),
        MapEntry('amount', amount.text),
      ], [
        if (receiptBytes != null) UploadFile('receipt', receiptBytes!, receipt!.name.isEmpty ? 'receipt.jpg' : receipt!.name),
      ]);
      await app.refreshAccount();
      if (mounted) {
        showMessage(context, widget.pack == null ? 'Payment received. Our team will review it shortly.' : 'Your premium credits are added once our team approves it.');
        Navigator.pop(context, true);
      }
    } on ApiException catch (caught) {
      setState(() => error = caught.message);
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final current = method;
    return Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
      Panel(
        title: '1. Choose how you will pay',
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          if (widget.pack != null)
            Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.goldBg, borderRadius: BorderRadius.circular(8)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('${widget.pack!['name']} · ${widget.pack!['kind'] == 'boost' ? tr('Boost for {days} days', {'days': widget.pack!['days']}) : tr('{count} profile credits', {'count': widget.pack!['credits']})}${widget.pack!['scope'] == 'foreign' ? ' · ${tr('International')}' : ''}', style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.goldText)),
                Text(tr('Amount to pay: {price}', {'price': 'Rs ${money(widget.pack!['price'])}'}), style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.goldText)),
              ]),
            )
          else if (widget.price != null && widget.price!.isNotEmpty)
            Container(margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AppColors.goldBg, borderRadius: BorderRadius.circular(8)), child: Text(tr('Amount to pay: {price}', {'price': widget.price}), style: const TextStyle(fontWeight: FontWeight.w600, color: AppColors.goldText))),
          for (final item in widget.methods)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Material(
                color: item['id'] == methodId ? const Color(0x0A062B4E) : Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10), side: BorderSide(color: item['id'] == methodId ? AppColors.navy : const Color(0xFFE7E9EE))),
                child: ListTile(
                  leading: const Icon(Icons.account_balance_rounded, color: Color(0xFFA67B2E)),
                  title: Text('${item['name']}', style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text('${item['bank_name']}'),
                  trailing: item['id'] == methodId ? const Icon(Icons.check_circle_rounded, color: Color(0xFF1F8A3A)) : null,
                  onTap: () => setState(() => methodId = (item['id'] as num).toInt()),
                ),
              ),
            ),
        ]),
      ),
      const SizedBox(height: 14),
      Panel(
        title: '2. Send your payment to this account',
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          _copyRow('Account title', current['account_holder']),
          _copyRow('IBAN', current['iban']),
          _copyRow('Account number', current['account_number']),
          if (current['instructions'] != null) Padding(padding: const EdgeInsets.only(top: 10), child: Tx('${current['instructions']}', style: const TextStyle(fontSize: 13, color: AppColors.muted, height: 1.6))),
          if (current['qr'] != null) Padding(padding: const EdgeInsets.only(top: 12), child: Center(child: NetImage('${current['qr']}', width: 220, height: 220, fit: BoxFit.contain))),
        ]),
      ),
      const SizedBox(height: 14),
      Panel(
        title: '3. Tell us about your payment',
        child: Column(crossAxisAlignment: CrossAxisAlignment.stretch, children: [
          TextInput(label: 'Sender name', controller: sender, required: true, maxLength: 120, hint: 'The name on the account you paid from.'),
          TextInput(label: 'Transaction ID', controller: transaction, required: true, maxLength: 80),
          TextInput(label: 'Amount paid', controller: amount, required: true, placeholder: '5000', keyboard: const TextInputType.numberWithOptions(decimal: true)),
          FieldShell(
            label: 'Payment screenshot or receipt',
            required: true,
            hint: 'JPG, PNG or WebP, up to 8 MB.',
            child: InkWell(
              onTap: () async {
                final file = await ImagePicker().pickImage(source: ImageSource.gallery, maxWidth: 2200, maxHeight: 2200, imageQuality: 90);
                if (file == null) return;
                final bytes = await file.readAsBytes();
                setState(() { receipt = file; receiptBytes = bytes; });
              },
              child: Container(
                height: receiptBytes == null ? 70 : 160,
                width: double.infinity,
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(8), border: Border.all(color: const Color(0xFFDCE0DC)), color: const Color(0xFFFAFBF9)),
                clipBehavior: Clip.antiAlias,
                child: receiptBytes == null
                    ? Row(mainAxisAlignment: MainAxisAlignment.center, children: [const Icon(Icons.upload_file_rounded, color: AppColors.gold), const SizedBox(width: 8), Text(tr('Choose from gallery'))])
                    : Image.memory(receiptBytes!, fit: BoxFit.contain),
              ),
            ),
          ),
          if (error != null) ...[Notice(error!), const SizedBox(height: 12)],
          AppButton(busy ? 'Sending…' : 'Submit payment', tone: Tone.gold, busy: busy, expand: true, onPressed: _submit),
          const SizedBox(height: 10),
          Tx(tr('Our team checks every payment. Your access unlocks once it is approved.'), style: const TextStyle(fontSize: 12, color: AppColors.muted)),
        ]),
      ),
    ]);
  }
}

