
import React from "react";
import axios from "axios";

const RegistrationHandler = ({
  inpuNickRef,
  inputPasswordRef,
  setRegistrationStatus,
  setIsLoggedIn,
  hiddenLoginMenu,
  setNickname,
  buttonClassName,
  buttonType,
  buttonRef,
}) => {
  const handleRegistration = async () => {
    const nickname = inpuNickRef.current.value.trim();
    const password = inputPasswordRef.current.value.trim();

    if (nickname && password !== "") {
      try {
        const response = await axios.post(
          "http://13.53.182.168:5023/registration",
          { nickname, password }
        );
        if (response.data.success) {
          if (response.data.loginSuccess) {
            setRegistrationStatus("Successful login!");
            setIsLoggedIn(true);
            hiddenLoginMenu();
            setNickname(nickname); // Обновляем состояние никнейма
          } else {
            setRegistrationStatus("Successful registration!");
            hiddenLoginMenu();
            setNickname(nickname); // Обновляем состояние никнейма
          }
        } else {
          setRegistrationStatus(
            `Error during registration or login: ${response.data.error}`
          );
        }
      } catch (error) {
        setRegistrationStatus(
          `Error during registration or login: ${error.message}`
        );
      }
    } else {
      setRegistrationStatus("Nickname and password cannot be blank");
    }
  };

  return (
      <button
        className={buttonClassName}
        type={buttonType}
        ref={buttonRef}
        onClick={handleRegistration}
      >
        Enter
      </button>
  );
};

export default RegistrationHandler;
