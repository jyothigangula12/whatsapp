//importing
import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from "cors";
//app config
const app = express();
const port = process.env.PORT || 9000;

const pusher = new Pusher({
	appId: "1087651",
	key: "a1ac225d4a6e8eb27255",
	secret: "d3ef9b94273944a64ed7",
	cluster: "eu",
	encrypted: true,
});

//middleware
app.use(express.json());
app.use(cors());
/*app.use((req, res, next) => {
	res.setHeader("Access-Control-Allow-Origin", "*");
	res.setHeader("Access-Control-Allow-Headers", "*");
	next();
});*/
//db config
const connetion_url =
	"mongodb+srv://admin:SbFQcmqjDlpuXq3W@cluster0.cxv4l.mongodb.net/whatsappDB?retryWrites=true&w=majority";
mongoose.connect(connetion_url, {
	useCreateIndex: true,
	useNewUrlParser: true,
	useUnifiedTopology: true,
});
const db = mongoose.connection;
db.once("open", () => {
	console.log("DB connected");

	const msgCollection = db.collection("messagecontents");
	const changeStream = msgCollection.watch();

	changeStream.on("change", (change) => {
		console.log(change);

		if (change.operationType === "insert") {
			const messageDetails = change.fullDocument;
			pusher.trigger("messages", "inserted", {
				name: messageDetails.name,
				message: messageDetails.message,
				timestamp: messageDetails.timestamp,
				recieved: messageDetails.recieved,
			});
		} else {
			console.log("Error triggering Pusher");
		}
	});
});
//api router
app.get("/", (req, res) => res.status(200).send("Hello world"));

app.get("/api/messages/sync", (req, res) => {
	Messages.find((err, data) => {
		if (err) {
			res.status(500).send(err);
		} else {
			res.status(200).send(data);
		}
	});
});
app.post("/api/messages/new", (req, res) => {
	const dbMessage = req.body;
	Messages.create(dbMessage, (err, data) => {
		if (err) {
			res.status(500).send(err);
		} else {
			res.status(201).send(`new message created: /n ${data}`);
		}
	});
});
//listener
app.listen(port, () => console.log("Listening on localhost:${port}"));
