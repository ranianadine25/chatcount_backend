import { CEGID_KEY, CEGID_SECRET, API_BASE_URL } from "../default.js";
import axios from "axios";
async function fetchComptableEntries() {
  try {
    const response = await axios.get('https://api.cegid.com/loop-api-publiques/EcritureComptable', {
      params: {
        codeDossier: '627',
        filter: 'codeJournal != null'
      },
      headers: {
        'Content-Type': 'application-json',
        'Accept': 'application/json, text/plain, */*',
        'x-apikey': 'CK7YH6QJCTUCF3A8B5TCH7UYH:LLcyaGYjXts1rLbDcFqCovRqW+e2B+QjQZTIf+Jzgtc=',
        'Ocp-Apim-Subscription-Key': 'c4baaa46015e4afb9cc5dd8cdbf1637a',
        'User-Agent': 'axios/1.7.1'
      }
    });

    console.log(response.data);
  } catch (error) {
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Status Text: ${error.response.statusText}`);
      console.error(`Headers: ${JSON.stringify(error.response.headers)}`);
      console.error(`Data: ${error.response.data}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
  }
}
export async function conectCegid(req, res) {
  const { codeDossier, filter, sort, skip, take } = req.query;
  if (!codeDossier || !filter) {
    return res
      .status(400)
      .json({ message: "Les paramètres codeDossier et filter sont requis" });
  }

  try {
    const entries = await fetchComptableEntries();
    res.json(entries);
  } catch (error) {
    res
      .status(500)
      .json({
        message: "Erreur lors de la récupération des écritures comptables",
      });
  }
}
