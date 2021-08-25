// Add required modules.
require("dotenv").config();
const fastify = require("fastify")({ logger: true });
const firebase = require("firebase/app");
require("firebase/auth");
// Take data from env file and populate the given fields in order firebase to work.
const firebaseConfig = {
  apiKey: process.env.apiKey,
  authDomain: process.env.authDomain,
  projectId: process.env.projectId,
  storageBucket: process.env.storageBucket,
  messagingSenderId: process.env.messagingSenderId,
  appId: process.env.appId,
};
// ------------------------------------------------------

// Register middleware.
fastify.register(require("fastify-sensible"));
fastify.register(require("fastify-formbody"));
fastify.register(require("point-of-view"), {
  engine: {
    pug: require("pug"),
  },
});
fastify.register(require("fastify-cors"));
fastify.register(require("fastify-helmet"), { contentSecurityPolicy: false });
// ------------------------------------------------------

// Initialize Firebase.
firebase.initializeApp(firebaseConfig);
// ------------------------------------------------------

// Gets the home page.
fastify.get("/", async (request, reply) => {
  await reply.view("index.pug");
});

// Gets login page
fastify.get("/login", async (request, reply) => {
  await reply.view("login.pug");
});

// Authenticates login details.
fastify.post("/login", async (request, reply) => {
  const { email, password } = await request.body;

  if (firebase.auth().currentUser) {
    firebase.auth().signOut();
  } else {
    if (password.length < 6) {
      reply.view("error.pug", {
        text: "Please enter a password that is at least 6 characters.",
      });
    }
    // Sign in with email and pass.
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then((userCreds) => {
        reply.redirect("/weather");
      })
      .catch((error) => {
        // Handle errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === "auth/wrong-password") {
          reply.view("error.pug", { text: "Wrong password!" });
        } else {
          reply.view("error.pug", { text: `${errorCode} - ${errorMessage}` });
        }
        reply.view("error.pug", { text: error });
      });
  }
  await reply;
});

// Gets weather page if logged in.
fastify.get("/weather", async (request, reply) => {
  const user = firebase.auth().currentUser;

  if (user) {
    await reply.view("weather.pug");
    firebase.auth().signOut();
  } else {
    await reply.send("Logged out.");
  }
});

fastify.get("/error", async (request, reply) => {
  await reply.view("error.pug", {
    text: "TEST",
  });
});

// -----------------------------------------------------------
// Run the server!
const start = async () => {
  try {
    await fastify.listen(process.env.PORT || 8080, (host = "0.0.0.0"));
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
