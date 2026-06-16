let allItems = [];
let defaultConfig = null;
let config = null;

const table = document.getElementById('lawTable');
const searchInput = document.getElementById('searchInput');
const impactFilter = document.getElementById('impactFilter');
const startDateInput = document.getElementById('startDate');
const endDateInput = document.getElementById('endDate');
const settingsPanel = document.getElementById('settingsPanel');
const keywordBox = document.getElementById('keywordBox');
const rangeDaysInput = document.getElementById('rangeDays');
const dateFormatSelect = document.getElementById('dateFormat');
const sourceList = document.getElementById('sourceList');

async function loadData(){
  const [dataRes, configRes] = await Promise.all([
    fetch('data.json?_=' + Date.now()),
    fetch('config.json?_=' + Date.now()).catch(() => null)
  ]);
  const data = await dataRes.json();
  defaultConfig = configRes && configRes.ok ? await configRes.json() : fallbackConfig();
  config = loadLocalConfig() || structuredClone(defaultConfig);
  allItems = data.items || [];
  document.getElementById('lastUpdated').textContent = data.lastUpdated || '-';
  applySettingsToForm();
  applyDefaultDateRange();
  render();
}

function fallbackConfig(){
  return {
    dateRangeDays: 60,
    dateFormat: 'yyyy-mm-dd',
    keywords: ['食品','罐頭','飲料','液態營養','食品添加物','標示','HACCP','GHP','輸中國','食品業者登錄','實驗室','檢驗方法','TQF'],
    sources: [
      { name: '食藥署公告', url: 'https://www.fda.gov.tw/TC/news.aspx?cid=4', enabled: true },
      { name: 'FES 食品輸銷平台', url: 'https://fes.fda.gov.tw/index', enabled: true },
      { name: 'TQF 最新消息', url: 'https://www.tqf.org.tw/News', enabled: true },
      { name: 'SGS 食品新聞', url: 'https://msn.sgs.com/News/FOOD', enabled: true }
    ]
  };
}

function loadLocalConfig(){
  try{
    const raw = localStorage.getItem('regulatoryTrackerConfig');
    return raw ? JSON.parse(raw) : null;
  }catch{
    return null;
  }
}

function saveLocalConfig(){
  localStorage.setItem('regulatoryTrackerConfig', JSON.stringify(config));
}

function applySettingsToForm(){
  keywordBox.value = (config.keywords || []).join('\n');
  rangeDaysInput.value = config.dateRangeDays || 60;
  dateFormatSelect.value = config.dateFormat || 'yyyy-mm-dd';
  renderSources();
}

function applyDefaultDateRange(){
  const dates = allItems.map(x => x.date).filter(Boolean).sort();
  const latest = dates.at(-1) || new Date().toISOString().slice(0,10);
  const start = new Date(latest + 'T00:00:00');
  start.setDate(start.getDate() - Number(config.dateRangeDays || 60));
  endDateInput.value = latest;
  startDateInput.value = start.toISOString().slice(0,10);
}

function renderSources(){
  sourceList.innerHTML = (config.sources || []).map((source, index) => `
    <div class="source-row" data-index="${index}">
      <label class="check"><input type="checkbox" class="source-enabled" ${source.enabled ? 'checked' : ''}>啟用</label>
      <input class="source-name" type="text" value="${escapeHtml(source.name)}" placeholder="網站名稱">
      <input class="source-url" type="url" value="${escapeHtml(source.url)}" placeholder="https://...">
      <button class="remove-source danger" type="button">刪除</button>
    </div>
  `).join('');
}

function readSettingsFromForm(){
  const keywords = keywordBox.value.split('\n').map(x => x.trim()).filter(Boolean);
  const sources = [...sourceList.querySelectorAll('.source-row')].map(row => ({
    enabled: row.querySelector('.source-enabled').checked,
    name: row.querySelector('.source-name').value.trim(),
    url: row.querySelector('.source-url').value.trim()
  })).filter(x => x.name && x.url);
  config = {
    dateRangeDays: Math.max(1, Number(rangeDaysInput.value || 60)),
    dateFormat: dateFormatSelect.value,
    keywords,
    sources
  };
}

function render(){
  const keyword = searchInput.value.trim().toLowerCase();
  const impact = impactFilter.value;
  const start = startDateInput.value;
  const end = endDateInput.value;
  const enabledSourceNames = new Set((config?.sources || []).filter(s => s.enabled).map(s => s.name));

  const filtered = allItems.filter(item => {
    const text = `${item.date} ${item.source} ${item.title} ${item.relation} ${item.action}`.toLowerCase();
    const itemDate = item.date || '';
    const sourceAllowed = enabledSourceNames.size === 0 || enabledSourceNames.has(item.source) || [...enabledSourceNames].some(name => item.source.includes(name.replace('公告','').replace('最新消息','').replace('食品新聞','').trim()));
    return sourceAllowed &&
      (!keyword || text.includes(keyword)) &&
      (impact === 'all' || item.impact === impact) &&
      (!start || itemDate >= start) &&
      (!end || itemDate <= end);
  });

  table.innerHTML = filtered.map(item => `
    <tr>
      <td>${escapeHtml(formatDate(item.date))}</td>
      <td>${escapeHtml(item.source)}</td>
      <td><a href="${escapeHtml(item.url)}" target="_blank" rel="noopener">${escapeHtml(item.title)}</a></td>
      <td><span class="tag ${impactClass(item.impact)}">${escapeHtml(item.impact)}</span></td>
      <td>${escapeHtml(item.relation)}</td>
      <td>${escapeHtml(item.action)}</td>
    </tr>
  `).join('') || '<tr><td colspan="6" class="empty">目前沒有符合條件的資料。</td></tr>';

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

function formatDate(dateStr=''){
  if(!dateStr) return '';
  const [y,m,d] = dateStr.split('-');
  if(config?.dateFormat === 'yyyy/mm/dd') return `${y}/${m}/${d}`;
  if(config?.dateFormat === 'tw') return `民國 ${Number(y)-1911}/${m}/${d}`;
  return dateStr;
}

function escapeHtml(str=''){
  return String(str).replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
}

function currentFilteredItems(){
  const rows = [...table.querySelectorAll('tbody tr')];
  return allItems.filter(item => rows.some(row => row.innerText.includes(item.title)));
}

function exportCsv(){
  const rows = [['日期','來源','標題','影響','與工廠關聯','建議處理','網址'], ...currentFilteredItems().map(i => [formatDate(i.date),i.source,i.title,i.impact,i.relation,i.action,i.url])];
  const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g,'""') + '"').join(',')).join('\n');
  downloadText('\ufeff' + csv, '食品法規更新追蹤.csv', 'text/csv;charset=utf-8;');
}

function downloadText(text, filename, type='application/json;charset=utf-8;'){
  const blob = new Blob([text], {type});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

searchInput.addEventListener('input', render);
impactFilter.addEventListener('change', render);
startDateInput.addEventListener('change', render);
endDateInput.addEventListener('change', render);
document.getElementById('exportCsv').addEventListener('click', exportCsv);
document.getElementById('toggleSettings').addEventListener('click', () => settingsPanel.classList.toggle('hidden'));
document.getElementById('addSource').addEventListener('click', () => {
  config.sources.push({ name: '', url: '', enabled: true });
  renderSources();
});
sourceList.addEventListener('click', e => {
  if(!e.target.classList.contains('remove-source')) return;
  const row = e.target.closest('.source-row');
  row.remove();
});
document.getElementById('saveSettings').addEventListener('click', () => {
  readSettingsFromForm();
  saveLocalConfig();
  applyDefaultDateRange();
  render();
  alert('設定已儲存到此瀏覽器。若要讓每月自動更新也套用，請下載 config.json 並上傳到 GitHub。');
});
document.getElementById('resetSettings').addEventListener('click', () => {
  localStorage.removeItem('regulatoryTrackerConfig');
  config = structuredClone(defaultConfig);
  applySettingsToForm();
  applyDefaultDateRange();
  render();
});
document.getElementById('downloadConfig').addEventListener('click', () => {
  readSettingsFromForm();
  downloadText(JSON.stringify(config, null, 2), 'config.json');
});

loadData();
