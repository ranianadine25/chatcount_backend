import conversation from "../Models/conversation.js";
import FECModel from "../Models/fec.js";
import natural from "natural";
import fs from "fs";
import csv from "csv-parser";

export async function paraphraser(req, res) {
  try {
    const { text } = req.body;
    const phrasesFromFile = await loadParaphrasesFromFile(
      "uploads/questions.csv"
    );

    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text);

    const filteredPhrases = [];
    phrasesFromFile.forEach((phrase) => {
      if (
        tokens.some((token) =>
          phrase.toLowerCase().includes(token.toLowerCase())
        )
      ) {
        const splitPhrases = phrase.split(";").map((p) => p.trim()); // Diviser les phrases par le délimiteur ";"
        filteredPhrases.push(...splitPhrases); // Ajouter chaque phrase à filteredPhrases
      }
    });

    // Créer le tableau paraphrases
    const paraphrases = tokens.flatMap((token) => {
      return filteredPhrases.map((phrase) => ({
        original: token,
        paraphrase: phrase,
      }));
    });

    res.status(200).json({ paraphrases });
  } catch (error) {
    console.error("Erreur lors de la récupération des phrases :", error);
    res
      .status(500)
      .json({ message: "Erreur lors de la récupération des phrases." });
  }
}

export async function loadParaphrasesFromFile(filePath) {
  return new Promise((resolve, reject) => {
    const phrases = [];

    fs.createReadStream(filePath)
      .pipe(csv({ delimiter: ";" })) // Utilisation du bon délimiteur
      .on("data", (data) => {
        Object.values(data).forEach((value) => {
          if (value.trim() !== "") {
            phrases.push(value.trim());
          }
        });
      })
      .on("end", () => {
        resolve(phrases);
      })
      .on("error", (error) => {
        console.error("Erreur lors de la lecture du fichier CSV :", error);
        reject(error);
      });
  });
}
export async function ajoutConversation(req, res) {
  const { userId, fecId } = req.params;
  const date = Date.now();
  const name = req.body.conversationName || req.body;
  console.log("rrrrrrrrrrrrrrrrr", name);
  const newconversation = new conversation({
    userId,
    fecId,
    date,
    name,
  });

  try {
    await newconversation.save();

    // Récupérer l'ID de la conversation
    const conversationId = newconversation._id;
    res
      .status(201)
      .json({ message: "Conversation créée avec succès", conversationId });
  } catch (error) {
    res.status(400).json({
      message: "Erreur lors de la création de la conversation",
      error,
    });
  }
}
export async function recupFecName(req, res) {
  try {
    const conversationId = req.params.conversationId;

    const conversationf = await conversation.findById(conversationId);
    if (!conversationf) {
      console.error("Conversation non trouvée.");
      return res.status(404).json({ message: "Conversation non trouvée." });
    }

    const fecId = conversationf.fecId;
    if (!fecId) {
      console.error("Identifiant FEC non trouvé dans la conversation.");
      return res
        .status(404)
        .json({ message: "Identifiant FEC non trouvé dans la conversation." });
    }

    const fec = await FECModel.findById(fecId);
    if (!fec) {
      console.error("FEC non trouvé.");
      return res.status(404).json({ message: "FEC non trouvé." });
    }
    console.log("ffffff", fecId);
    return res.status(200).json({ fecName: fec.name });
  } catch (error) {
    console.error("Erreur lors de la récupération du nom du FEC :", error);
    return res
      .status(500)
      .json({ message: "Erreur lors de la récupération du nom du FEC", error });
  }
}
export async function recupFecId(req, res) {
  try {
    const conversationId = req.params.conversationId;

    const conversationf = await conversation.findById(conversationId);
    if (!conversationf) {
      console.error("Conversation non trouvée.");
      return res.status(404).json({ message: "Conversation non trouvée." });
    }

    const fecId = conversationf.fecId;
    if (!fecId) {
      console.error("Identifiant FEC non trouvé dans la conversation.");
      return res.status(404).json({ message: "Identifiant FEC non trouvé dans la conversation." });
    }

    console.log("FEC ID:", fecId);
    return res.status(200).json({ fecId });
  } catch (error) {
    console.error("Erreur lors de la récupération de l'ID du FEC :", error);
    return res.status(500).json({ message: "Erreur lors de la récupération de l'ID du FEC", error });
  }
}

export async function afficherConv(req, res) {
  try {
    const userId = req.params.userId;

    const conversations = await conversation.find({ userId });

    res.status(200).json({ conversations });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des conversations",
      error,
    });
  }
}
export async function afficherConvShared(req, res) {
  try {
    const userId = req.params.userId;

    const conversations = await conversation.find({ participants: userId });

    res.status(200).json({ conversations });
  } catch (error) {
    res.status(500).json({
      message: "Erreur lors de la récupération des conversations",
      error,
    });
  }
}

export async function recupConv(req, res) {
  const { conversationId } = req.params;

  try {
    if (conversationId === ":id") {
      return res.json([]);
    }

    const conversationM = await conversation.findById(conversationId);

    if (!conversationM) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    res.json(conversationM.messages); // Renvoyer les messages de la conversation
  } catch (error) {
    console.error("Error fetching conversation messages:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export const deleteConversation = async (req, res) => {
  console.log("deeeeeeeeeeeeeeeeeeeeeeeel");
  try {
    const conversationToDelete = await conversation.findByIdAndDelete(
      req.params.id
    );
    if (!conversationToDelete) {
      return res.status(404).json({ message: "Conversation non trouvée" });
    }
    res.status(200).json({ message: "Conversation supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la conversation :", error);
    res.status(500).json({
      message: "Erreur lors de la suppression de la conversation",
      error,
    });
  }
};

export async function renameConversation(req, res) {
  const conversationId = req.params.id;
  const { name } = req.body;

  try {
    // Rechercher la conversation par ID
    const newconversation = await conversation.findById(conversationId);

    if (!newconversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Mettre à jour le nom de la conversation
    newconversation.name = name;
    await newconversation.save();

    // Répondre avec la conversation mise à jour
    res
      .status(200)
      .json({ message: "Conversation updated successfully", conversation });
  } catch (error) {
    res.status(500).json({ message: "Error updating conversation", error });
  }
}
export async function enregistrerMessage(req, res) {
  const { conversationId } = req.params;
  const { text, sender, likes = 0, dislikes = 0 } = req.body; // Include likes & dislikes in the request body

  try {
    let conversationm = await conversation.findById(conversationId);

    if (!conversationm) {
      throw new Error("Conversation non trouvée");
    }

    const existingMessageIndex = conversationm.messages.findIndex(
      (message) => message.text === text && message.sender === sender // Check for duplicate messages (optional)
    );

    if (existingMessageIndex !== -1) {
      conversationm.messages[existingMessageIndex].likes = likes; // Update likes/dislikes for existing message
      conversationm.messages[existingMessageIndex].dislikes = dislikes;
    } else {
      conversationm.messages.push({
        text,
        sender,
        timestamp: new Date(),
        likes, // Include likes & dislikes in the message object
        dislikes,
      });
    }

    await conversationm.save();

    console.log(
      "Message enregistré avec succès dans la conversation:",
      conversationm
    );
    res.status(201).json(conversationm);
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du message:", error);
    res
      .status(500)
      .json({ error: "Erreur lors de l'enregistrement du message" });
  }
}
