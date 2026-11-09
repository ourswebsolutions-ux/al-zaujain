import 'package:flutter/material.dart';

import '../core/api.dart';
import '../core/app_state.dart';
import '../core/theme.dart';
import '../widgets/cards.dart';
import '../widgets/common.dart';
import '../widgets/pickers.dart';

/// The website's /proposals pages: region tabs, keyword search, every filter, sorting and paging.
class ProposalsScreen extends StatefulWidget {
  const ProposalsScreen({super.key});

  @override
  State<ProposalsScreen> createState() => ProposalsScreenState();
}

class ProposalsScreenState extends State<ProposalsScreen> {
  Map<String, String> filters = {};
  String path = '';
  Json? result;
  List<Json> cards = [];
  Object? error;
  bool loading = false;
  bool loadingMore = false;
  final scroll = ScrollController();
  final keyword = TextEditingController();

  @override
  void initState() {
    super.initState();
    scroll.addListener(() {
      if (scroll.position.pixels > scroll.position.maxScrollExtent - 600) _more();
    });
    _load();
  }

  @override
  void dispose() {
    scroll.dispose();
    super.dispose();
  }

  /// Called from the home screen's search boxes and region chips.
  void search({Map<String, String> filters = const {}, String path = ''}) {
    final open = filters['_open'] == '1';
    final next = Map.of(filters)..remove('_open')..removeWhere((key, value) => value.isEmpty);
    // The homepage's age range ("26-30") becomes the two age boxes.
    final age = next.remove('age');
    if (age != null && RegExp(r'^\d{2}-\d{2}$').hasMatch(age)) {
      next['age_min'] = age.split('-')[0];
      next['age_max'] = age.split('-')[1];
    }
    setState(() { this.filters = next; this.path = path; keyword.text = next['q'] ?? ''; });
    _load();
    if (open) WidgetsBinding.instance.addPostFrameCallback((_) => _openFilters());
  }

  Future<void> _load() async {
    setState(() { loading = true; error = null; });
    try {
      final data = await app.api.get('proposals', {...filters, 'path': path});
      app.saved = {...app.saved, ...((data['saved'] as List?) ?? []).map((code) => '$code')};
      setState(() {
        result = data;
        cards = _cards(data);
      });
      if (scroll.hasClients) scroll.jumpTo(0);
    } catch (caught) {
      setState(() => error = caught);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  List<Json> _cards(Json data) => ((data['profiles'] as List?) ?? []).cast<Map>().map((item) => item.cast<String, dynamic>()).toList();

  Future<void> _more() async {
    final data = result;
    if (data == null || loading || loadingMore) return;
    final page = (data['page'] as num).toInt();
    if (page >= (data['pages'] as num).toInt()) return;
    setState(() => loadingMore = true);
    try {
      final next = await app.api.get('proposals', {...filters, 'path': path, 'page': '${page + 1}'});
      setState(() {
        result = next;
        cards = [...cards, ..._cards(next)];
      });
    } catch (_) {
      // Scrolling again retries.
    } finally {
      if (mounted) setState(() => loadingMore = false);
    }
  }

  int get _activeCount => filters.keys.where((key) => !['q', 'sort', 'page'].contains(key)).length;

  Future<void> _openFilters() async {
    final data = result;
    if (data == null) return;
    final chosen = await showModalBottomSheet<Map<String, String>>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      builder: (_) => FilterSheet(initial: filters, countries: ((data['countries'] as List?) ?? []).map((item) => '$item').toList(), cities: ((data['cities'] as List?) ?? []).cast<Map>().map((item) => item.cast<String, dynamic>()).toList()),
    );
    if (chosen == null) return;
    setState(() => filters = {...chosen, if (keyword.text.trim().isNotEmpty) 'q': keyword.text.trim()});
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final data = result;
    final tabs = ((data?['tabs'] as List?) ?? []).cast<Map>();
    final total = (data?['total'] as num?)?.toInt() ?? 0;
    final category = data?['category'] as Map?;
    return Scaffold(
      appBar: AppBar(
        title: Text(data == null ? tr('Proposals') : tr('${data['title']}')),
        actions: [
          IconButton(
            tooltip: tr('Sort by'),
            icon: const Icon(Icons.sort_rounded),
            onPressed: data == null
                ? null
                : () async {
                    final sorts = ((app.config['sorts'] as List?) ?? []).cast<Map>();
                    final picked = await showPicker(context, title: 'Sort by', options: [for (final sort in sorts) Option('${sort['key']}', tr('${sort['label']}'))], selected: filters['sort'] ?? 'newest', searchable: false);
                    if (picked != null && picked.isNotEmpty) {
                      setState(() => filters = {...filters, 'sort': picked});
                      _load();
                    }
                  },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.gold,
        onRefresh: _load,
        child: CustomScrollView(controller: scroll, physics: const AlwaysScrollableScrollPhysics(), slivers: [
          SliverToBoxAdapter(
            child: Container(
              color: AppColors.cream,
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                if (category?['name_ur'] != null) UrduLine('${category!['name_ur']}', size: 16),
                if (category?['description'] != null) Padding(padding: const EdgeInsets.only(bottom: 10), child: Tx(tr('${category!['description']}'), style: const TextStyle(fontSize: 12.5, color: AppColors.muted, height: 1.5))),
                Row(children: [
                  Expanded(
                    child: TextField(
                      controller: keyword,
                      textInputAction: TextInputAction.search,
                      maxLength: 80,
                      onSubmitted: (value) {
                        setState(() => filters = {...filters, 'q': value.trim()}..removeWhere((key, value) => value.isEmpty));
                        _load();
                      },
                      decoration: InputDecoration(counterText: '', fillColor: Colors.white, prefixIcon: const Icon(Icons.search_rounded), hintText: tr('Name, caste, city or profession')),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Badge(
                    isLabelVisible: _activeCount > 0,
                    label: Text('$_activeCount'),
                    backgroundColor: AppColors.gold,
                    textColor: AppColors.dark,
                    child: AppButton('Filters', icon: Icons.tune_rounded, onPressed: data == null ? null : _openFilters),
                  ),
                ]),
                if (tabs.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  SizedBox(
                    height: 36,
                    child: ListView(scrollDirection: Axis.horizontal, children: [
                      for (final tab in tabs)
                        Padding(
                          padding: const EdgeInsetsDirectional.only(end: 8),
                          child: ChoiceChip(
                            label: Text(tab['all'] == true ? tr('All {name}', {'name': tr('${tab['name']}')}) : tr('${tab['name']}')),
                            selected: '${tab['href']}' == '${data?['path']}',
                            showCheckmark: false,
                            selectedColor: AppColors.navy,
                            backgroundColor: Colors.white,
                            side: BorderSide(color: '${tab['href']}' == '${data?['path']}' ? AppColors.navy : AppColors.line),
                            labelStyle: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: '${tab['href']}' == '${data?['path']}' ? Colors.white : AppColors.navy),
                            onSelected: (_) {
                              setState(() => path = '${tab['href']}'.replaceFirst('/proposals', '').replaceFirst(RegExp(r'^/'), ''));
                              _load();
                            },
                          ),
                        ),
                    ]),
                  ),
                ],
              ]),
            ),
          ),
          if (error != null && cards.isEmpty)
            SliverFillRemaining(hasScrollBody: false, child: ErrorView(error!, onRetry: _load))
          else if (data == null)
            const SliverFillRemaining(hasScrollBody: false, child: LoadingView())
          else ...[
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                child: Row(children: [
                  Expanded(child: Text(tr(total == 1 ? '{count} proposal found' : '{count} proposals found', {'count': total}), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600))),
                  if (loading) const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2)),
                  if (filters.isNotEmpty && !loading)
                    TextButton(
                      onPressed: () {
                        keyword.clear();
                        setState(() => filters = {});
                        _load();
                      },
                      child: Text(tr('Clear filters')),
                    ),
                ]),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverToBoxAdapter(
                child: cards.isEmpty
                    ? EmptyState(icon: Icons.search_off_rounded, title: 'No proposals match these filters yet', text: 'Try fewer filters, or speak to our team and we will look for you.', action: AppButton('Chat on WhatsApp', tone: Tone.whatsapp, icon: Icons.chat_rounded, small: true, onPressed: () => openLink(context, whatsappUrl())))
                    : CardGrid(cards: cards),
              ),
            ),
            SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.all(24), child: loadingMore ? const LoadingView() : const SizedBox(height: 40))),
          ],
        ]),
      ),
    );
  }
}

/// Every filter on the website's filter panel, including the "More filters" ones.
class FilterSheet extends StatefulWidget {
  const FilterSheet({super.key, required this.initial, required this.countries, required this.cities});
  final Map<String, String> initial;
  final List<String> countries;
  final List<Json> cities;

  @override
  State<FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<FilterSheet> {
  late Map<String, String> values = Map.of(widget.initial)..remove('q');

  List<Option> _formOptions(String name) {
    for (final section in (app.config['form'] as List)) {
      for (final field in (section['fields'] as List)) {
        if (field['name'] == name) return optionsFrom(field['options']);
      }
    }
    return const [];
  }

  void _set(String key, String value) => setState(() {
        if (value.isEmpty) {
          values.remove(key);
        } else {
          values[key] = value;
        }
      });

  @override
  Widget build(BuildContext context) {
    final country = values['country'] ?? '';
    final seen = <String>{};
    final cityOptions = [
      for (final city in widget.cities)
        if ((country.isEmpty || city['country'] == country) && seen.add('${city['name']}')) Option('${city['name']}', tr('${city['name']}'), country.isEmpty ? tr('${city['country']}') : null),
    ];
    final ages = [for (var age = 18; age <= 70; age++) Option('$age', '$age')];
    final heights = ((app.config['heights'] as List?) ?? []).cast<Map>().map((item) => Option('${item['value']}', '${item['label']}'.split(' (').first)).toList();
    return Column(children: [
      Padding(
        padding: const EdgeInsetsDirectional.fromSTEB(20, 0, 8, 8),
        child: Row(children: [
          Expanded(child: Text(tr('Search and filter'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700))),
          TextButton(onPressed: () => setState(() => values = {}), child: Text(tr('Clear all'))),
        ]),
      ),
      Expanded(
        child: ListView(padding: const EdgeInsets.fromLTRB(20, 0, 20, 20), children: [
          Tx(tr('Combine as many filters as you like. Only profiles matching all of them are shown.'), style: const TextStyle(fontSize: 12.5, color: AppColors.muted)),
          const SizedBox(height: 14),
          PickerField(label: 'Looking for', options: [Option('female', tr('Bride')), Option('male', tr('Groom'))], value: values['gender'], anyLabel: 'Bride or groom', onChanged: (value) => _set('gender', value)),
          Row(children: [
            Expanded(child: PickerField(label: 'Age from', options: ages, value: values['age_min'], anyLabel: 'Any', onChanged: (value) => _set('age_min', value))),
            const SizedBox(width: 10),
            Expanded(child: PickerField(label: 'Age to', options: ages, value: values['age_max'], anyLabel: 'Any', onChanged: (value) => _set('age_max', value))),
          ]),
          if (widget.countries.length > 1)
            PickerField(label: 'Country', options: widget.countries.map((name) => Option(name, tr(name))).toList(), value: values['country'], anyLabel: 'Any country', onChanged: (value) {
              _set('country', value);
              final city = values['city'];
              if (value.isNotEmpty && city != null && !widget.cities.any((item) => item['name'] == city && item['country'] == value)) _set('city', '');
            }),
          PickerField(label: 'City', options: cityOptions, value: values['city'], anyLabel: 'Any city', allowCustom: true, onChanged: (value) => _set('city', value)),
          PickerField(label: 'Caste / Biradari', options: optionsFrom(app.config['castes']), value: values['caste'], anyLabel: 'Any', allowCustom: true, onChanged: (value) => _set('caste', value)),
          PickerField(label: 'Education', options: _formOptions('education_level'), value: values['education'], anyLabel: 'Any education', onChanged: (value) => _set('education', value)),
          TextInput(label: 'Profession', initial: values['profession'], placeholder: 'e.g. Teacher', maxLength: 80, onChanged: (value) => _set('profession', value.trim())),
          PickerField(label: 'Marital status', options: _formOptions('marital_status'), value: values['marital'], anyLabel: 'Any', onChanged: (value) => _set('marital', value)),
          PickerField(label: 'Religion', options: _formOptions('religion'), value: values['religion'], anyLabel: 'Any religion', onChanged: (value) => _set('religion', value)),
          PickerField(label: 'Sect', options: _formOptions('sect'), value: values['sect'], anyLabel: 'Any sect', onChanged: (value) => _set('sect', value)),
          Row(children: [
            Expanded(child: PickerField(label: 'Height from', options: heights, value: values['height_min'], anyLabel: 'Any', onChanged: (value) => _set('height_min', value))),
            const SizedBox(width: 10),
            Expanded(child: PickerField(label: 'Height to', options: heights, value: values['height_max'], anyLabel: 'Any', onChanged: (value) => _set('height_max', value))),
          ]),
          PickerField(label: 'Nationality', options: optionsFrom(app.config['nationalities']), value: values['nationality'], anyLabel: 'Any', allowCustom: true, onChanged: (value) => _set('nationality', value)),
          SwitchListTile(contentPadding: EdgeInsets.zero, title: Text(tr('Verified profiles only'), style: const TextStyle(fontSize: 14)), value: values['verified'] == '1', onChanged: (on) => _set('verified', on ? '1' : '')),
          SwitchListTile(contentPadding: EdgeInsets.zero, title: Text(tr('With photo only'), style: const TextStyle(fontSize: 14)), value: values['photo'] == '1', onChanged: (on) => _set('photo', on ? '1' : '')),
        ]),
      ),
      SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
          child: AppButton('Show results', tone: Tone.gold, expand: true, icon: Icons.search_rounded, onPressed: () => Navigator.pop(context, values)),
        ),
      ),
    ]);
  }
}
