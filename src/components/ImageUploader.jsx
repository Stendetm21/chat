
import React from "react";
import axios from "axios";

function ImageUploader({ nickname, setUploadedImageUrl, getOnlineUsers }) {
  const handleImageUpload = async (event) => {
    event.preventDefault();

    const nicknameValue = nickname.trim(); // получаем текущий никнейм

    if (event.target.files && event.target.files.length > 0) {
      const formData = new FormData();
      formData.append("image", event.target.files[0]);
      formData.append("nickname", nicknameValue); // используем актуальное значение nickname

      try {
        const response = await axios.post(
          "http://13.53.182.168:5023/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data.success) {
          console.log(
            "Image uploaded successfully. Image URL:",
            response.data.imageUrl
          );
          setUploadedImageUrl(response.data.imageUrl);
          getOnlineUsers();
        } else {
          console.error("Image upload failed:", response.data.error);
        }
      } catch (error) {
        console.error("Error uploading image:", error.message);
      }
    } else {
      console.error("No files selected.");
    }
  };

  return (
    <label htmlFor="imageInput" className="custom-file-upload">
      <input
        type="file"
        id="imageInput"
        name="image"
        accept="image/*"
        onChange={handleImageUpload}
      />
    </label>
  );
}

export default ImageUploader;
