import json
from pathlib import Path

src = Path('/home/ubuntu/console_outputs/exec_result_2026-08-20_03-36-23_835.txt')
out = Path('/home/ubuntu/decodeanalyticsacademy-correct/history-summary-2026-08-20.json')
data = json.loads(src.read_text())
versions = data['versions']

def first_marker(text, patterns):
    low = text.lower()
    return {name: pattern in low for name, pattern in patterns.items()}

# The console summary contains lengths and snippets only, but that is sufficient to locate the transition.
patterns = {
    'old_bundle': 'excel | power bi | pesquisa operacional',
    'date_19_08': '19/08/2026',
    'part2': 'parte 2',
    'generator': 'gerador de energia',
    'teams': 'as equipes do projeto',
}
summary = {
    'count': len(versions),
    'first_date_19_08_index': next((v['i'] for v in versions if v['markers'].get('date')), None),
    'first_part2_index': next((v['i'] for v in versions if v['markers'].get('part2')), None),
    'first_generator_index': next((v['i'] for v in versions if v['markers'].get('generator')), None),
    'first_old_bundle_index': next((v['i'] for v in versions if v['markers'].get('old')), None),
    'first_date_19_08_version': next((v for v in versions if v['markers'].get('date')), None),
    'last_versions': versions[-12:],
    'versions_by_length_change': [],
}
for prev, cur in zip(versions, versions[1:]):
    if abs(cur['contentLength'] - prev['contentLength']) >= 1000 or cur['markers'] != prev['markers']:
        summary['versions_by_length_change'].append({
            'from': {'i': prev['i'], 'createdAt': prev['createdAt'], 'length': prev['contentLength'], 'markers': prev['markers']},
            'to': {'i': cur['i'], 'createdAt': cur['createdAt'], 'length': cur['contentLength'], 'markers': cur['markers'], 'start': cur['start']},
        })
out.write_text(json.dumps(summary, ensure_ascii=False, indent=2))
print(out)
print(json.dumps({k: summary[k] for k in ['count','first_date_19_08_index','first_part2_index','first_generator_index','first_old_bundle_index']}, ensure_ascii=False))
print('changes', len(summary['versions_by_length_change']))
for item in summary['versions_by_length_change']:
    print(item)
