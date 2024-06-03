import express from "express";
import mongoose from "mongoose";
import morgan from "morgan";
import cors from "cors";
import http from "http";
import bodyParser from "body-parser";
import { spawn } from "child_process";
import { Server } from "socket.io";
import { MONGODB_URL } from "./default.js";
import ConversationModel from "./Models/conversation.js";
import userRoute from "./Routes/auth_route.js";
import fecRoute from "./Routes/fec_route.js";
import natural from "natural";
import conversationRoute from "./Routes/conversation_route.js";
import FECModel from "./Models/fec.js";
import conversation from "./Models/conversation.js";
import dossierRoute from "./Routes/dossier_route.js";
import labelRoute from "./Routes/label_route.js";
import notifRoute from "./Routes/notification_route.js";
import motCletRoute from "./Routes/motclets_routes.js";
import patternsRoutes from "./Routes/patterns_routs.js";
import cegidRoutes from "./Routes/cegid_routes.js";
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "https://www.chatcount.ai",
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  },
});
io.engine.on("connection_error", (err) => {
  console.log(err.req);
  console.log(err.code);
  console.log(err.message); // the error message, for example "Session ID unknown"
  console.log(err.context); // some additional error context
});

const port = process.env.PORT || 7001;

// Connect to MongoDB
mongoose
  .connect(
    "mongodb+srv://ranianadine:kUp44PvOVpUzcyhK@chatcountdb.lrppzqm.mongodb.net/?retryWrites=true&w=majority&appName=chatcountdb",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      family: 4,
    }
  )
  .then(() => {
    console.log("Database connected!");
  })
  .catch((err) => console.error("Database connection error:", err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: "https://www.chatcount.ai",
    methods: ["GET", "POST", "DELETE", "PATCH", "PUT", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Origin",
      "X-Requested-With",
      "Accept",
    ],
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(bodyParser.json());
app.use("/avatars", express.static("public/images"));

// Routes
app.use("/user", userRoute);
app.use("/conversation", conversationRoute);

app.use("/fec", fecRoute);
app.use("/dossier", dossierRoute);
app.use("/label", labelRoute);
app.use("/notif", notifRoute);
app.use("/mots", motCletRoute);
app.use("/patterns", patternsRoutes);
app.use("/cegid", cegidRoutes);

app.use("/", (req, res) => {
  res.send("helloo");
});

let fecName;
let pythonProcess;
let isMessageSaved = false;
io.on("connection", (socket) => {
  console.log("Un utilisateur s'est connecté");
  socket.on("fetchUserConversation", async (userId) => {
    try {
      const userConversation = await conversation.findOne({ userId });

      if (!userConversation) {
        console.log("Aucune conversation trouvée pour cet utilisateur.");
        return;
      }

      const { _id: conversationId, fecId } = userConversation;

      const fec = await FECModel.findById(fecId);
      const fecName = fec ? fec.name : "Nom du FEC introuvable";

      const isPythonProcessRunning = false; // À remplacer par votre logique pour vérifier l'état du processus Python

      socket.emit("userConversationDetails", {
        conversationId,
        fecName,
        isPythonProcessRunning,
      });
    } catch (error) {
      console.error(
        "Erreur lors de la récupération de la conversation de l'utilisateur:",
        error
      );
    }
  });

  socket.on("fetchFecName", async (conversationId) => {
    try {
      const conversation = await ConversationModel.findById(conversationId);

      if (!conversation) {
        console.error("Conversation non trouvée.");
        return;
      }

      const fecId = conversation.fecId;

      if (!fecId) {
        console.error("Identifiant FEC non trouvé dans la conversation.");
        return;
      }

      const fec = await FECModel.findById(fecId);

      if (!fec) {
        console.error("FEC non trouvé.");
        return;
      }

      fecName = fec.name;
      console.log("fecname", fecName);

      pythonProcess = spawn("python", ["./similarity.py", fecName, "uploads/"]);

      pythonProcess.stdout.on("data", async (data) => {
        try {
          const output = data.toString().trim();
          let response;

          if (output.includes(";")) {
            response = output.split("\n").map((line) => {
              const [month, revenue, percentage] = line
                .split(";")
                .map((entry) => entry.trim());
              return { month, revenue, percentage };
            });
          } else if (output.includes(",")) {
            response = output.split("\n").map((line) => {
              const [month, revenue, percentage] = line
                .split(",")
                .map((entry) => entry.trim());
              return { month, revenue, percentage };
            });
          } else {
            response = output;
          }

          // Enregistrement du message dans la base de données
          await saveMessageToDatabase(
            "bot",
            response,
            conversationId,
            0,
            0,
            []
          ); // Vous pouvez définir comment ici comme une chaîne vide car il n'y a pas de commentaire initial

          const botMessage = {
            sender: "bot",
            text: response,
            likes: 0,
            dislikes: 0,
            comments: [],
          };

          socket.emit("message", botMessage);

          socket.on("updateLikesDislikes", async (data) => {
            const { conversationId, message, likes, dislikes, comments } = data;
            console.log(
              `Reçu une demande de mise à jour des likes/dislikes pour la conversation ${conversationId} - Likes: ${likes}, Dislikes: ${dislikes}`
            );

            try {
              await ConversationModel.updateOne(
                { _id: conversationId, "messages._id": message._id },
                {
                  $set: {
                    "messages.$.likes": likes,
                    "messages.$.dislikes": dislikes,
                    "messages.$.comments": comments,
                  },
                }
              );
              console.log(
                "Likes et Dislikes mis à jour avec succès dans la base de données."
              );

              await saveMessageToDatabase(
                "bot",
                response,
                conversationId,
                likes,
                dislikes,
                comments
              );
              io.to(conversationId).emit("updateLikesDislikes", {
                likes,
                dislikes,
                comments,
              });
              console.log(
                "Broadcast de la mise à jour des likes/dislikes terminé."
              );
            } catch (error) {
              console.error(
                "Erreur lors de la mise à jour des likes et dislikes:",
                error
              );
            }
          });

          console.log("Message enregistré :", {
            sender: "bot",
            text: response,
          });
        } catch (error) {
          console.error(
            "Erreur lors de la manipulation des données de sortie du processus Python:",
            error
          );
        }
      });

      pythonProcess.stderr.on("data", (data) => {
        console.error(`Erreur de similarity Python : ${data}`);
      });

      pythonProcess.on("close", (code) => {
        console.log(`Processus Python terminé avec le code de sortie ${code}`);
      });
    } catch (error) {
      console.error("Erreur lors de la récupération du FEC:", error);
    }
  });

  socket.on("message", async (data) => {
    try {
      const { conversationId, text } = data;
      const tokenizer = new natural.WordTokenizer();
      const tokens = tokenizer.tokenize(text);
      const reformulations = tokens.map((token) => {
        return token + " s'il vous plaît";
      });
      const reformulatedText = reformulations.join(" "); // Convertissez les reformulations en une seule chaîne de texte

      if (!fecName || !pythonProcess) {
        console.error(
          "Le nom FEC ou le processus Python n'est pas encore initialisé."
        );
        return;
      }

      pythonProcess.stdin.write(text + "\n");
      await saveMessageToDatabase("user", text, conversationId, 0, 0);
    } catch (error) {
      console.error("Erreur lors du traitement du message:", error);
    }
  });

  socket.on("disconnect", () => {
    if (socket.room) {
      socket.leave(socket.room);
      console.log(`Utilisateur déconnecté de la salle ${socket.room}`);
    }

    conversation.findOneAndUpdate(
      { userId: socket.userId },
      {
        conversationId: socket.conversationId,
        fecName: fecName,
        isPythonProcessRunning: !!pythonProcess, // Convertir en booléen pour stocker
      },
      { upsert: true } // Créer un nouveau document si nécessaire
    );
  });
});

server.listen(port, () => {
  console.log(`Serveur en cours d'exécution sur http://localhost:${port}/`);
});
async function saveMessageToDatabase(
  sender,
  text,
  conversationId,
  likes,
  dislikes,
  comments // Now an array to store comments
) {
  try {
    let conversation = await ConversationModel.findById(conversationId);

    if (!conversation) {
      conversation = new ConversationModel({
        _id: conversationId,
        messages: [],
      });
    }

    const lastMessageIndex = conversation.messages.length - 1;

    if (
      lastMessageIndex >= 0 &&
      conversation.messages[lastMessageIndex].sender === sender &&
      conversation.messages[lastMessageIndex].text === text
    ) {
      console.log("Adding New Comment to Last Message:", text);
      conversation.messages[lastMessageIndex].comments.push(...comments);
    } else {
      console.log("Adding New Message:", text);
      conversation.messages.push({
        sender,
        text,
        likes,
        dislikes,
        comments,
      });
    }

    await conversation.save();
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du message:", error);
  }
}
