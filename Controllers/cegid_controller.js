import axios from "axios";
import { CEGID_KEY, CEGID_SECRET, API_BASE_URL,CEGID_PRIMARY_KEY, CEGID_SECONDARY_KEY } from "../default.js";

async function fetchComptableEntries(codeDossier, filter, sort, skip, take) {
  try {
    const response = await axios.get(`${API_BASE_URL}/EcritureComptable`, {
      params: {
        codeDossier,
        filter,
        sort,
        skip,
        take
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/plain, */*',
        'x-apikey': CEGID_KEY,
        'Ocp-Apim-Subscription-Key': CEGID_SECONDARY_KEY,
        'User-Agent': 'axios/1.7.1',
      }
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Status Text: ${error.response.statusText}`);
      console.error(`Headers: ${JSON.stringify(error.response.headers)}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`Error: ${error.message}`);
    }
    throw error;
  }
}
export async function conectCegid(req, res) {
  const { codeDossier, filter, sort, skip, take } = req.query;

  if (!codeDossier || !filter) {
    return res.status(400).json({ message: "Les paramètres codeDossier et filter sont requis" });
  }

  try {
    const entries = await fetchComptableEntries(codeDossier, filter, sort, skip, take);
    res.json(entries);
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des écritures comptables",
    });
  }
}
