import user from "../Models/user.js";
import bcrypt from "bcrypt";
import NodeCache from "node-cache";
import Invitation from "../Models/invitation.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET, JWT_EXPIRATION } from "../default.js";
import nodemailer from "nodemailer";
import Conversation from "../Models/conversation.js"
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: "ppay81755@gmail.com",
    pass: "iawd rctp qwwi bsot",
  },
});

export async function signUp(req, res) {
  const { name, nickName, email, password, phone, role, speciality, address } =
    req.body;

  // const verifUser = await user.findOne({ email: req.body.email });
  // if (verifUser) {
  //   console.log("user already exists");
  //   res.status(403).send({ message: "User already exists !" });
  //   return;
  // }

  console.log("Success");

  const mdpEncrypted = await bcrypt.hash(req.body.password, 10);
  const newUser = new user();

  newUser.avatar = req.file.filename;

  newUser.name = req.body.name;
  newUser.nickName = req.nickName;
  newUser.email = req.body.email;
  newUser.password = mdpEncrypted;
  newUser.phone = req.body.phone;
  newUser.role = req.body.role;
  newUser.speciality = req.body.speciality;
  newUser.address = req.body.address;
  newUser.invitedBy = req.body.invitationBy;

  await newUser.save();
  const mailOptions = {
    from: "chatcountai@gmail.com",
    to: newUser.email,
    subject: "Inscription réussie",
    html: `<p>Bonjour ${newUser.name},</p>
           <p>Votre compte a été créé avec succès !</p>
           <p>Vous pouvez maintenant vous connecter à l'application ChatCount en utilisant ce lien : <a href="https://www.chatcount.ai/">chatcount</a></p>`,
  };
  const payload = {
    _id: newUser._id,
    name: newUser.name,
    nickName: newUser.nickName,
    email: newUser.email,
    phone: newUser.phone,
    role: newUser.role,
    speciality: newUser.speciality,
    address: newUser.address,
    avatar: newUser.avatar,
    invitedBy: newUser.invitedBy,
  };

  const token = jwt.sign({ payload }, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION,
  });

  res.status(300).send({
    token: token,
    statusCode: res.statusCode,
    message: "Logged in with success!",
  });
  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });

  console.log(token);
}
const cache = new NodeCache({ stdTTL: 600 });
export async function login(req, res) {
  const start = process.hrtime();
  console.log("connect");

  try {
    const { email, password } = req.body;
    const cacheKey = `user_${email}`;

    const cacheCheckStart = process.hrtime();
    if (cache.has(cacheKey)) {
      const cachedUser = cache.get(cacheKey);
      const cacheCheckEnd = process.hrtime(cacheCheckStart);
      console.log(`Cache hit pour user ${email}`);
      console.log(
        `Temps de vérification du cache: ${cacheCheckEnd[1] / 1e6} ms`
      );

      const payload = {
        id: cachedUser._id,
        name: cachedUser.name,
        email: cachedUser.email,
        phone: cachedUser.phone,
        role: cachedUser.role,
        address: cachedUser.address,
      };

      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRATION,
      });

      const end = process.hrtime(start);
      console.log(`Requête de connexion traitée en ${end[1] / 1e6} ms`);
      return res.status(200).json({
        token,
        userInfo: cachedUser,
      });
    }
    const cacheCheckEnd = process.hrtime(cacheCheckStart);
    console.log(`Cache miss pour user ${email}`);
    console.log(`Temps après cache miss: ${cacheCheckEnd[1] / 1e6} ms`);

    const dbQueryStart = process.hrtime();
    const userInfo = await user.findOne({ email });
    const dbQueryEnd = process.hrtime(dbQueryStart);
    console.log(
      `Temps de la requête à la base de données: ${dbQueryEnd[1] / 1e6} ms`
    );

    if (
      !userInfo ||
      userInfo.status === 0 ||
      !bcrypt.compareSync(password, userInfo.password)
    ) {
      return res.status(404).json({
        error: "Invalid credentials",
      });
    }

    const cacheSetStart = process.hrtime();
    cache.set(cacheKey, userInfo);
    const cacheSetEnd = process.hrtime(cacheSetStart);
    console.log(`Temps de mise en cache: ${cacheSetEnd[1] / 1e6} ms`);

    const payload = {
      id: userInfo._id,
      name: userInfo.name,
      email: userInfo.email,
      phone: userInfo.phone,
      role: userInfo.role,
      address: userInfo.address,
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
    });
    console.log(token);

    const end = process.hrtime(start);
    console.log(`Requête de connexion traitée en ${end[1] / 1e6} ms`);

    return res.status(200).json({
      token,
      userInfo,
    });
  } catch (error) {
    const errorEnd = process.hrtime(start);
    console.error(`Erreur après ${errorEnd[1] / 1e6} ms:`, error);

    return res.status(500).json({
      message: "Une erreur est survenue lors de la connexion.",
    });
  }
}
export async function updateUser(req, res) {
  const userId = req.params.userId;

  try {
    const newuser = await user.findById(userId);

    if (!newuser) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    console.log("Données reçues pour mise à jour:", req.body);

    if (req.body.name) newuser.name = req.body.name;
    if (req.body.nickName) newuser.nickName = req.body.nickName;
    if (req.body.email) newuser.email = req.body.email;
    if (req.body.phone) newuser.phone = req.body.phone;
    if (req.body.role) newuser.role = req.body.role;
    if (req.body.speciality) newuser.speciality = req.body.speciality;
    if (req.body.address) newuser.address = req.body.address;

    console.log("Données avant sauvegarde:", newuser);

    await newuser.save();

    console.log("Données après sauvegarde:", newuser);

    res.status(200).json({
      user: newuser,
      message: "Données utilisateur mises à jour avec succès.",
    });
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour des données utilisateur :",
      error
    );
    res.status(500).json({
      message:
        "Une erreur s'est produite lors de la mise à jour des données utilisateur.",
    });
  }
}

export async function updateAvatar(req, res) {
  const userId = req.params.userId;

  try {
    const existingUser = await user.findById(userId);

    if (!existingUser) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Aucun fichier téléchargé." });
    }

    existingUser.avatar = req.file.filename;

    await existingUser.save();

    res.status(200).json({
      user: existingUser,
      message: "Avatar mis à jour avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'avatar :", error);
    res.status(500).json({
      message: "Une erreur s'est produite lors de la mise à jour de l'avatar.",
    });
  }
}
export async function inviteUser(req, res) {
  const { email, inviterId } = req.body;

  try {
    // Générer un jeton d'invitation
    const token = jwt.sign({ email, inviterId }, JWT_SECRET, {
      expiresIn: "7d",
    });
    const invitationLink = `localhost:4200/invitation?token=${token}`;

    // Enregistrer l'invitation dans la base de données
    const invitation = new Invitation({ email, inviterId, token });
    await invitation.save();

    // Configurer les options de l'email
    const mailOptions = {
      from: "chatcountai@gmail.com",
      to: email,
      subject: "Invitation à rejoindre ChatCount",
      html: `<p>Bonjour,</p>
             <p>Vous avez été invité à rejoindre ChatCount. Cliquez sur le lien ci-dessous pour créer votre compte :</p>
             <a href="${invitationLink}">${invitationLink}</a>`,
    };

    // Envoyer l'email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res
          .status(500)
          .send({ message: "Failed to send invitation email." });
      } else {
        console.log("Email sent:", info.response);
        return res
          .status(200)
          .send({ message: "Invitation sent successfully." });
      }
    });
  } catch (error) {
    console.error("Error generating token:", error);
    res.status(500).send({ message: "Failed to generate invitation link." });
  }
}
export async function verifyInvitation(req, res) {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const { email, inviterId } = decoded;

    // Vérifier si l'invitation existe dans la base de données
    const invitation = await Invitation.findOne({ token });
    if (!invitation) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    res.status(200).json({ email, inviterId });
  } catch (error) {
    res.status(400).json({ message: "Invalid or expired token" });
  }
}
export async function getInvitedUser(req, res) {
  const { inviterId } = req.params;

  try {
    const invitations = await Invitation.find({ inviterId });

    const invitedEmails = invitations.map((invitation) => invitation.email);

    const invitedUsers = await user.find({ email: { $in: invitedEmails } });

    res.status(200).json(invitedUsers);
  } catch (error) {
    console.error("Error fetching invited users:", error);
    res.status(500).send({ message: "Failed to fetch invited users." });
  }
}

export const inviteUsersToConversation = async (req, res) => {
  const { conversationId, userIds } = req.body;

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    conversation.participants.push(...userIds);
    await conversation.save();

    await user.updateMany(
      { _id: { $in: userIds } },
      { $addToSet: { sharedConversations: conversationId } }
    );

    res.status(200).json({ message: "Users invited to the conversation successfully" });
  } catch (error) {
    console.error("Error inviting users to conversation:", error);
    res.status(500).json({ message: "Failed to invite users to the conversation", error });
  }
};