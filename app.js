let allItems = [];

const table = document.getElementById('lawTable');
const searchInput = document.getElementById('searchInput');
const impactFilter = document.getElementById('impactFilter');

async function loadData(){
  const res = await fetch('data.json?_=' + Date.now());
  const data = await res.json();
  allItems = data.items || [];
  document.getElementById('lastUpdated').textContent = data.lastUpdated || '-';
  render();
}

function render(){
  const keyword = searchInput.value.trim().toLowerCase();
  const impact = impactFilter.value;
  const filtered = allItems.filter(item => {
    const text = `${item.date} ${item.source} ${item.title} ${item.relation} ${item.action}`.toLowerCase();
    return (!keyword || text.includes(keyword)) && (impact === 'all' || item.impact === impact);
  });

  table.innerHTML = filtered.map(item => `
    <tr>
      <td>${escapeHtml(item.date)}</td>
      <td>${escapeHtml(item.source)}</td>
      <td><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a></td>
      <td><span class="tag ${impactClass(item.impact)}">${escapeHtml(item.impact)}</span></td>
      <td>${escapeHtml(item.relation)}</td>
      <td>${escapeHtml(item.action)}</td>
    </tr>
  `).join('');

  document.getElementById('totalCount').textContent = filtered.length;
  document.getElementById('highCount').textContent = filtered.filter(x => x.impact === '高').length;
  document.getElementById('midCount').textContent = filtered.filter(x => x.impact === '中').length;
  document.getElementById('lowCount').textContent = filtered.filter(x => x.impact === '低').length;
}

function impactClass(impact){
  if(impact === '高') return 'high';
  if(impact === '中') return 'mid';
  return 'low';
}

function escapeHtml(str=''){
  return String(str).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

function exportCsv(){
  const rows = [['日期','來源','標題','影響','與工廠關聯','建議處理','網址'], ...allItems.map(i => [i.date,i.source,i.title,i.impact,i.relation,i.action,i.url])];
  const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '食品法規更新追蹤.csv';
  a.click();
  URL.revokeObjectURL(url);
}

searchInput.addEventListener('input', render);
impactFilter.addEventListener('change', render);
document.getElementById('exportCsv').addEventListener('click', exportCsv);
loadData();
