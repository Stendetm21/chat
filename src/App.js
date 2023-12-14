import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./App.css";
import ReconnectingWebSocket from "reconnecting-websocket";
import ImageUploader from "./components/ImageUploader.jsx"; // добавили импорт
import RegistrationHandler from "./components/RegistrationHendler.jsx";

let counter = 0;
let ws;
let clientId; // объявление переменной clientId за пределами функции компонента

function App() {
  if (!counter) {
    ws = new WebSocket("ws://13.53.182.168:5023");
  }
  counter += 1;
  const statusRef = useRef(null);
  const messagesRef = useRef(null);
  const chatblockRef = useRef(null);
  const inpuNickRef = useRef(null);
  const inputRef = useRef(null);
  const onlineRef = useRef(null);
  const inputPasswordRef = useRef(null);
  const [status, setStatus] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [registrationStatus, setRegistrationStatus] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const enterButtonRef = useRef(null);
  const [messageInputs, setMessageInputs] = useState({});
  const passwordRef = useRef(null);
  const [isChatFlashing, setIsChatFlashing] = useState(false);
  const [nickname, setNickname] = useState(""); // Новое состояние для никнейма
  const [currentTime, setCurrentTime] = useState("");
  const [uploadedImageUrl, setUploadedImageUrl] = useState("");
  const [fullSizeImageUrl, setFullSizeImageUrl] = useState("");

  const hiddenLoginMenu = () => {
    if (inputPasswordRef.current) {
      inputPasswordRef.current.style.display = "none";
    }
    if (enterButtonRef.current) {
      enterButtonRef.current.style.display = "none";
      passwordRef.current.style.display = "none";
    }
    if (inpuNickRef.current) {
      inpuNickRef.current.style.display = "none";
    }
  };
  const printMessage = (value, className, nickname) => {
    if (messagesRef.current && value && typeof value === "string") {
      const blockMessageDiv = document.createElement("div");

      const nickDiv = document.createElement("div");
      nickDiv.textContent = nickname + ":";
      if (nickname === undefined) {
        nickDiv.textContent = "";
      }
      nickDiv.classList.add("nick");
      blockMessageDiv.appendChild(nickDiv);

      const messageDiv = document.createElement("div");
      messageDiv.className = "message";

      const textDiv = document.createElement("div");
      textDiv.className = "text"; // Добавляем класс text
      textDiv.textContent = value;

      const timeDiv = document.createElement("div");
      timeDiv.className = "message-time";
      const currentTime = new Date();
      const hours = currentTime.getHours().toString().padStart(2, "0");
      const minutes = currentTime.getMinutes().toString().padStart(2, "0");
      const seconds = currentTime.getSeconds().toString().padStart(2, "0");
      timeDiv.textContent = `${hours}:${minutes}:${seconds}`;

      messageDiv.appendChild(textDiv);
      messageDiv.appendChild(timeDiv);

      blockMessageDiv.appendChild(messageDiv);

      blockMessageDiv.classList.add(className); // Добавляем класс к blockMessageDiv
      messagesRef.current.appendChild(blockMessageDiv);
      chatblockRef.current.scrollTo({
        top: chatblockRef.current.scrollHeight,
        behavior: "smooth",
      });

      setIsChatFlashing(true);
      setTimeout(() => {
        setIsChatFlashing(false);
      }, 1500);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const inputValue = inputRef.current.value.trim();
    const inputNickValue = inpuNickRef.current.value.trim();
    const inputPasswordValue = inputPasswordRef.current.value.trim();

    if (inputValue && inputNickValue && inputPasswordValue) {
      const messageData = {
        message: inputValue,
        nickname: inputNickValue,
        password: inputPasswordValue,
      };

      const mentionedUsers = findMentionedUsers(inputValue);
      if (mentionedUsers.length > 0) {
        messageData.mentions = mentionedUsers;
      }

      ws.send(JSON.stringify(messageData));

      setMessageInputs((prevInputs) => ({
        ...prevInputs,
        [clientId]: "", // Очищаем поле ввода только для текущего клиента
      }));
      console.log("clientID", clientId);
    } else if (nickname) {
      // Пользователь зарегистрирован и может отправлять сообщения
      if (inputValue) {
        const messageData = {
          message: inputValue,
          nickname: nickname,
        };

        const mentionedUsers = findMentionedUsers(inputValue);
        if (mentionedUsers.length > 0) {
          messageData.mentions = mentionedUsers;
        }

        ws.send(JSON.stringify(messageData));

        setMessageInputs((prevInputs) => ({
          ...prevInputs,
          [clientId]: "",
        }));
        console.log("clientID", clientId);
      } else {
        setRegistrationStatus("Cannot send empty message");
      }
    } else {
      setRegistrationStatus("You need to log in to send messages");
    }
    setTimeout(() => {
      setRegistrationStatus("");
    }, 10000);
    setFullSizeImageUrl("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSubmit(event);
    }
  };
  const findMentionedUsers = (message) => {
    const mentionedUsers = [];
    const words = message.split(" ");

    for (const word of words) {
      if (word.startsWith("@")) {
        // Извлечение ника из упоминания и добавление в массив
        const mentionedUser = word.slice(1);
        mentionedUsers.push(mentionedUser);
        console.log("mentionedUsers", mentionedUsers);
      }
    }

    return mentionedUsers;
  };
  useEffect(() => {
    const updateCurrentTime = () => {
      const currentTime = new Date();
      const hours = currentTime.getHours().toString().padStart(2, "0");
      const minutes = currentTime.getMinutes().toString().padStart(2, "0");
      const seconds = currentTime.getSeconds().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}:${seconds}`);
    };
    updateCurrentTime();
    const intervalId = setInterval(updateCurrentTime, 1000);
    const handleOpen = () => {
      setStatus("online...");
      getOnlineUsers();
      statusRef.current.className = "status";
    };
    const handleClose = () => {
      setStatus("disconnected...");
      statusRef.current.className = "disconnected-style";
      setOnlineUsers("∞");
    };
    const handleOnline = (response) => {
      const parsedResponse = JSON.parse(response.data);
      setOnlineUsers(parsedResponse.online);
    };
    const handleMessage = (response) => {
      const parsedResponse = JSON.parse(response.data);

      if (!clientId) {
        clientId = parsedResponse.clientId;
      }
      try {
        const messageType = parsedResponse.type || "";
        const clientIdServer = parsedResponse.origin;
        if (messageType === "server") {
          printMessage(
            parsedResponse.data,
            "block-message-server",
            clientIdServer
          );
        } else if (messageType === "client" && clientIdServer === clientId) {
          printMessage(
            parsedResponse.data,
            "block-message",
            inpuNickRef.current.value
          );
        } else if (messageType === "client" && clientIdServer !== clientId) {
          printMessage(
            parsedResponse.data,
            "block-message-other",
            parsedResponse.nickname
          );
        } else if (messageType === "privateMessage") {
          printMessage(
            parsedResponse.data,
            "block-message-private",
            parsedResponse.nickname
          );
        } else if (
          messageType === "imageUploaded" &&
          inpuNickRef.current.value !== parsedResponse.nickname
        ) {
          console.log("qqqq", parsedResponse.nickname);
          handleImageMessage({
            imageUrl: parsedResponse.imageUrl,
            nickname: parsedResponse.nickname,
            time: parsedResponse.time,
          });
        } else if (
          messageType === "imageUploaded" &&
          inpuNickRef.current.value === parsedResponse.nickname
        ) {
          console.log("qqqq", parsedResponse.nickname);
          handleImageMessage(
            {
              imageUrl: parsedResponse.imageUrl,
              nickname: parsedResponse.nickname,
              time: parsedResponse.time,
            },
            true
          );
        }
        if (parsedResponse.type === "getOnlineUsers") {
          setOnlineUsers(parsedResponse.online);
        }
      } catch (error) {
        console.error("Ошибка при разборе JSON:", error);
      }
    };
    const handleImageMessage = (message, className) => {
      const { imageUrl, nickname, time } = message;

      const imageElement = document.createElement("img");
      imageElement.classList.add("image");
      imageElement.src = imageUrl;

      const imageContainer = document.createElement("div");
      if (className === undefined) {
        imageContainer.classList.add("uploaded-image-container-other");
      } else {
        imageContainer.classList.add("uploaded-image-container");
      }
      imageContainer.appendChild(imageElement);

      const infoDiv = document.createElement("div");
      infoDiv.classList.add("image-info");
      const nicknameDiv = document.createElement("div");
      nicknameDiv.classList.add("image-nickname");
      nicknameDiv.textContent = nickname;
      infoDiv.appendChild(nicknameDiv);
      const timeDiv = document.createElement("div");
      timeDiv.classList.add("image-time");
      timeDiv.textContent = time;
      infoDiv.appendChild(timeDiv);
      imageContainer.appendChild(infoDiv);
      messagesRef.current.appendChild(imageContainer);
      chatblockRef.current.scrollTo({
        top: chatblockRef.current.scrollHeight,
        behavior: "smooth",
      });
      imageElement.onclick = () => {
        setFullSizeImageUrl(imageUrl);
        console.log(fullSizeImageUrl, "onlick");
      };
    };

    ws.onopen = handleOpen;
    ws.onclose = handleClose;
    ws.onmessage = (response) => {
      handleMessage(response);
      handleOnline(response);
    };

    return () => {
      ws.onopen = null;
      ws.onclose = null;
      ws.onmessage = null;
      clearInterval(intervalId);
    };
  }, []);
  const getOnlineUsers = () => {
    ws.send(JSON.stringify({ type: "getOnlineUsers" }));
  };

  return (
    <header className="App-header">
      <div className="status" id="status" ref={statusRef}>
        <div className="title-status">{status}</div>
        <div className="online" ref={onlineRef}>
          {onlineUsers}
        </div>
        <div className="time-now">{currentTime}</div>
      </div>
      <div className={`chat-window ${isChatFlashing ? "flash" : ""}`}>
        <div className="form">
          <div className="title-input">
            Your nickname: <div className="nick">{nickname}</div>
          </div>
          <input id="inputNick" ref={inpuNickRef} onKeyDown={handleKeyDown} />
          <div className="title-input" ref={passwordRef}>
            Your password:{" "}
          </div>
          <input
            id="inputNick"
            type="password"
            ref={inputPasswordRef}
            onKeyDown={handleKeyDown}
          />
          <RegistrationHandler
            inpuNickRef={inpuNickRef}
            inputPasswordRef={inputPasswordRef}
            setRegistrationStatus={setRegistrationStatus}
            setIsLoggedIn={setIsLoggedIn}
            hiddenLoginMenu={hiddenLoginMenu}
            setNickname={setNickname}
            buttonClassName="btn-nick"
            buttonType="submit"
            buttonRef={enterButtonRef}
          />
          <div className="registration-status">{registrationStatus}</div>
        </div>
        <div className="chat-block" ref={chatblockRef}>
          <div id="messages" ref={messagesRef}></div>
          <form onSubmit={handleSubmit} className="form-message">
            <div className="input-container">
              <input
                id="input"
                ref={inputRef}
                placeholder="Enter message..."
                autoComplete="off"
                value={messageInputs[clientId] || ""}
                onChange={(e) =>
                  setMessageInputs((prevInputs) => ({
                    ...prevInputs,
                    [clientId]: e.target.value,
                  }))
                }
                onKeyDown={handleKeyDown}
              />
              <ImageUploader
                nickname={nickname}
                setUploadedImageUrl={setUploadedImageUrl}
                getOnlineUsers={getOnlineUsers}
              />
            </div>

            <button className="btn-send" type="submit">
              Send
            </button>
          </form>
        </div>
      </div>
      <div>
        {fullSizeImageUrl && (
          <div
            className="full-size-image-overlay"
            onClick={() => setFullSizeImageUrl("")}
          >
            <img src={fullSizeImageUrl} alt="Full Size" />
          </div>
        )}
      </div>
    </header>
  );
}

export default App;
