const path = require('path');
const fs = require('fs');

const LEADS_FILE = path.join(__dirname, '..', 'data', 'leads.json');

function listLeads() {
  if (!fs.existsSync(LEADS_FILE)) {
    return [];
  }
  try {
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
  } catch (_) {
    return [];
  }
}

function saveLead(lead) {
  fs.mkdirSync(path.dirname(LEADS_FILE), { recursive: true });
  const leads = listLeads();
  leads.push({ source: 'form', bookingDate: '', note: '', ...lead });
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf8');
}

module.exports = { listLeads, saveLead };
