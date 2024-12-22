import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { CloudinaryImage } from "@cloudinary/url-gen";
import "two-up-element";
import PropTypes from "prop-types";
import {
  blackwhite,
  generativeBackgroundReplace,
  generativeRemove,
  generativeReplace,
  upscale,
} from "@cloudinary/url-gen/actions/effect";
import Slider from "@mui/material/Slider";
import Skeleton from "@mui/material/Skeleton";
import "./App.css";
const cloudName = "dpkcafrvf"; // Reemplaza con tu cloud name de Cloudinary
const uploadPreset = "narutoremover"; // Reemplaza con tu upload preset de Cloudinary

const ImageUploader = ({ nombre = "asdasd" }) => {
  const [uploadedImage, setUploadedImage] = useState(null); // URL original subida
  const [transformedImage, setTransformedImage] = useState(null); // Imagen con transformación
  const [uploading, setUploading] = useState(false);
  const [removeObject, setRemoveObject] = useState("");
  const [replacebgInput, setreplacebgInput] = useState("");
  const [urlWithEffects, setUrlWithEffects] = useState("");
  const [transformationHistory, setTransformationHistory] = useState([]);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const [loadingImages, setLoadingImages] = useState({}); // Almacena el estado de carga de las imágenes
  const [eupscale, seteupscale] = useState(false);
  const [fromReplace, setfromReplace] = useState("");
  const [toReplace, setToReplace] = useState("");
  const [isLoadingTransformed, setLoadingTransformed] = useState(true);
  console.log(nombre);
  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0]; // El primer archivo subido
    const formData = new FormData();

    formData.append("file", file); // Adjunta el archivo
    formData.append("upload_preset", uploadPreset); // Adjunta el upload preset

    try {
      setUploading(true); // Indicamos que estamos subiendo el archivo

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: "POST",
          body: formData, // El archivo se manda dentro de un FormData
        }
      );

      const data = await response.json();
      setUploadedImage(data.secure_url); // Guarda la URL de la imagen subida en el estado
      setTransformationHistory((prevHistory) => [
        data.secure_url,
        ...prevHistory,
      ]);
      console.log(data, "data");
      // Crear objeto CloudinaryImage con el public_id
      const cloudinaryImage = new CloudinaryImage(data.public_id, {
        cloudName,
      });
      setUrlWithEffects(cloudinaryImage); // Guarda el objeto para aplicar efectos
      setUploading(false);
    } catch (error) {
      console.error("Error al subir la imagen:", error);
      setUploading(false); // Si hay un error, terminamos la carga
    }
  }, []);

  const upscaleImage = () => {
    seteupscale(true);
  };

  const [blur, setBlur] = useState("");
  const [blurFace, setBlurFace] = useState("");

  const handleChange = (event, newValue) => {
    console.log(newValue, "newValue");
    setBlur(newValue);
  };
  const blurFaces = (event, newValue) => {
    console.log(newValue, "newValue");
    setBlurFace(newValue);
  };
  const applyEffects = () => {
    const effectOrder = [
      "e_gen_remove",
      "e_gen_replace",
      "e_gen_background_replace",
      "e_upscale",
      "e_blur",
    ];
    let url =
      selectedImageUrl !== ""
        ? selectedImageUrl
        : typeof urlWithEffects?.toURL === "function"
        ? urlWithEffects.toURL()
        : urlWithEffects;
    console.log(url, "urlprincipal");
    const existingEffects =
      url.split("/upload/")[1]?.split("/").slice(0, -1) || []; // Dividir y eliminar el último segmento que no es un efecto
    console.log(existingEffects, "existing");
    let effects = [...existingEffects];
    if (removeObject !== "") {
      effects.push(`e_gen_remove:prompt_${removeObject}`);
    }

    if (replacebgInput !== "") {
      effects = effects.filter(
        (effect) => !effect.includes("e_gen_background_replace")
      );
      effects.push(`e_gen_background_replace:prompt_${replacebgInput}`);
    }
    if (blur !== "") {
      effects = effects.filter((effect) => !effect.includes("e_blur"));
      effects.push(`e_blur:${blur}`);
    }
    if (blurFace !== "") {
      effects = effects.filter((effect) => !effect.includes("e_blur_faces"));
      effects.push(`e_blur_faces:${blurFace}`);
    }
    if (eupscale) {
      console.log("entre aqui upscale");
      effects.push(`e_upscale`);
    }
    if (fromReplace !== "" && toReplace !== "") {
      effects.push(`e_gen_replace:from_${fromReplace};to_${toReplace}`);
    }
    if (effects.length > 0) {
      console.log(effects, "effects");
      const baseUrl = url.split("/upload/")[0] + "/upload/";
      const orderedEffects = effects.sort((a, b) => {
        const aIndex = effectOrder.findIndex((effect) => a.includes(effect));
        const bIndex = effectOrder.findIndex((effect) => b.includes(effect));
        return aIndex - bIndex;
      });
      const effectPaths = orderedEffects.join("/");
      console.log(effectPaths, "effectpaths");
      console.log("split", url.split("/upload/")[1]);
      const lastSlashIndex = url.lastIndexOf("/");
      const imageId = url.slice(lastSlashIndex + 1);

      const finalUrl = `${baseUrl}${effectPaths}/${imageId}`; // Reconstruye la URL
      url = finalUrl;

      // Marca la imagen como cargando
      setLoadingImages((prev) => ({ ...prev, [url]: true }));
    }

    // Actualiza el estado con la nueva URL transformada
    setUrlWithEffects(url);
    setTransformedImage(url);
    setTransformationHistory((prevHistory) => [...prevHistory, url]);
    setRemoveObject("");
    setfromReplace("");
    setToReplace("");
    setreplacebgInput("");
    seteupscale(false);
    setLoadingTransformed(true);
  };

  const promptRemoveObject = (e) => {
    setRemoveObject(e.target.value);
  };

  const promptbgReplaceObject = (e) => {
    setreplacebgInput(e.target.value);
  };
  const fromReplaceObject = (e) => {
    setfromReplace(e.target.value);
  };
  const toReplaceObject = (e) => {
    setToReplace(e.target.value);
  };

  // Al hacer clic en una imagen del historial, se establece como la transformada a comparar
  const selectTransformation = (selectedImageUrl) => {
    // Establecer la imagen seleccionada como la nueva base para las transformaciones
    setTransformedImage(selectedImageUrl);
    setSelectedImageUrl(selectedImageUrl); // Guardar la URL seleccionada
    console.log(selectedImageUrl, "selectedImageUrl");
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: "image/*",
  });
  console.log(loadingImages, "transformationHistory1");
  useEffect(() => {
    if (eupscale) {
      applyEffects();
    }
  }, [eupscale, blur, blurFace]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        maxWidth: "1440px",
        margin: "0 auto",
        marginTop: "30px",
        padding: "20px", // Agregado padding
        backgroundColor: "#f9f9f9", // Color de fondo suave
        borderRadius: "8px", // Bordes redondeados
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)", // Sombra sutil
      }}
    >
      <div style={{ maxWidth: "350px", padding: "10px" }}>
        {uploadedImage ? (
          <>
            <label htmlFor="">Agregar Blur a imagen</label>
            <Slider
              min={100}
              max={2000}
              value={blur}
              valueLabelDisplay="auto"
              onChange={handleChange}
              onChangeCommitted={(event, newValue) => applyEffects()}
              color="secondary"
            />
            <button
              onClick={applyEffects}
              className="button"
              style={{ marginTop: "10px" }}
            >
              <i className="fas fa-blur" /> Aplicar Blur
            </button>
            <br />

            <label htmlFor="">Agregar Blur a caras</label>
            <Slider
              min={100}
              max={2000}
              value={blurFace}
              valueLabelDisplay="auto"
              onChange={blurFaces}
              color="secondary"
              onChangeCommitted={(event, newValue) => applyEffects()}
            />
            <button
              onClick={applyEffects}
              className="button"
              style={{ marginTop: "10px" }}
            >
              {" "}
              <h1>{nombre}</h1>
              <i className="fas fa-blur" /> Aplicar Blur a caras
            </button>
            <br />

            <input
              type="text"
              onChange={fromReplaceObject}
              placeholder="Reemplaza objeto"
              value={fromReplace}
              style={{ marginTop: "10px", width: "100%", padding: "5px" }} // Estilo agregado
            />
            <input
              type="text"
              onChange={toReplaceObject}
              placeholder="a"
              value={toReplace}
              style={{ marginTop: "10px", width: "100%", padding: "5px" }} // Estilo agregado
            />
            <button
              onClick={applyEffects}
              className="button"
              style={{ marginTop: "10px" }}
            >
              Reemplazar objeto
            </button>

            <input
              type="text"
              onChange={promptRemoveObject}
              placeholder="Objeto a remover"
              value={removeObject}
              style={{ marginTop: "10px", width: "100%", padding: "5px" }} // Estilo agregado
            />
            <button
              onClick={applyEffects}
              className="button"
              style={{ marginTop: "10px" }}
            >
              Remover objetos
            </button>

            <input
              type="text"
              onChange={promptbgReplaceObject}
              placeholder="Reemplazar fondo generativo"
              value={replacebgInput}
              style={{ marginTop: "10px", width: "100%", padding: "5px" }} // Estilo agregado
            />
            <button
              onClick={applyEffects}
              className="button"
              style={{ marginTop: "10px" }}
            >
              Reemplazar fondo
            </button>

            <button
              onClick={upscaleImage}
              className="button"
              style={{ marginTop: "10px" }}
            >
              Escalar imagen
            </button>
          </>
        ) : null}
      </div>

      <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center" }}>
          Subir imagen a Cloudinary y aplicar transformación
        </h1>

        {!uploadedImage ? (
          <div
            {...getRootProps()}
            style={{
              border: "2px dashed #007BFF",
              padding: "40px",
              textAlign: "center",
              cursor: "pointer",
              backgroundColor: isDragActive ? "#f0f0f0" : "#fff",
            }}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <p>Suelta los archivos aquí...</p>
            ) : (
              <p>
                Arrastra y suelta una imagen aquí, o haz clic para seleccionar
              </p>
            )}
          </div>
        ) : null}

        {uploading && <p>Subiendo imagen...</p>}
        {uploadedImage && !transformedImage && (
          <img
            src={uploadedImage}
            alt="Uploaded"
            style={{ maxWidth: "100%", height: "auto" }}
          />
        )}
        {uploadedImage && transformedImage && (
          <two-up>
            <img
              src={uploadedImage}
              alt="Uploaded"
              style={{ maxWidth: "100%", height: "auto" }}
            />
            {isLoadingTransformed ? ( // Cambia esta variable según tu lógica
              <div
                style={{
                  width: "100%",
                  height: "auto", // Ajusta según lo necesites
                  borderRadius: "4px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Skeleton
                  variant="rectangular"
                  width={500}
                  height={500} // Ajusta según el tamaño deseado
                  sx={{ bgcolor: "#9c27b030" }}
                />
                <img
                  src={transformedImage}
                  onLoad={() => {
                    setLoadingTransformed(false); // Marca como no cargando
                  }}
                  alt="Transformed"
                  style={{ maxWidth: "100%", height: "auto", display: "none" }}
                />
              </div>
            ) : (
              <img
                src={transformedImage}
                onLoad={() => {
                  setLoadingTransformed(false); // Marca como no cargando
                }}
                alt="Transformed"
                style={{ maxWidth: "100%", height: "auto" }}
              />
            )}
          </two-up>
        )}
      </div>

      {/* Contenedor para las miniaturas */}
      <div style={{ padding: "20px", maxWidth: "200px" }}>
        <h3>Historial de Transformaciones</h3>
        {transformationHistory.map((image, index) => {
          const isLoading = loadingImages[image]; // Verifica si esta imagen está cargando
          console.log(isLoading, "Loading img");
          return (
            <div
              key={index}
              style={{ marginBottom: "10px", cursor: "pointer" }}
              onClick={() => selectTransformation(image)}
            >
              {isLoading ? (
                <div
                  style={{
                    width: "100%",
                    height: "100px",
                    borderRadius: "4px",
                  }}
                >
                  {/* Aquí puedes agregar un loader o skeleton más elaborado si lo deseas */}
                  <img
                    src={image}
                    onLoad={() => {
                      setLoadingImages((prev) => ({ ...prev, [image]: false })); // Marca como no cargando
                    }}
                    alt={`Transformed version ${index + 1}`}
                    style={{ display: "none" }} // Ocultar la imagen
                  />
                  <Skeleton
                    variant="rectangular"
                    width={200}
                    height={100}
                    sx={{ bgcolor: "#9c27b057" }}
                  />
                </div>
              ) : (
                <img
                  src={image}
                  onLoad={() => {
                    setLoadingImages((prev) => ({ ...prev, [image]: false })); // Marca como no cargando
                  }}
                  alt={`Transformed version ${index + 1}`}
                  style={{
                    width: "100%",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "4px",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

ImageUploader.propTypes = {
  nombre: PropTypes.number,
};
export default ImageUploader;
