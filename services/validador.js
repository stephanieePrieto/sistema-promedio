const libxmljs = require("libxmljs2");
const fs = require("fs");
const path = require("path");


const rutaXSD = path.join(__dirname, "..", "schema", "sistema.xsd");
const xsdDoc = libxmljs.parseXml(fs.readFileSync(rutaXSD, "utf8"));


function validarXML(contenidoXMLString) {
  let xmlDoc;

  try {
    xmlDoc = libxmljs.parseXml(contenidoXMLString);
  } catch (err) {
    return {
      valido: false,
      errores: [`XML mal formado: ${err.message}`],
    };
  }

  const esValido = xmlDoc.validate(xsdDoc);

  if (esValido) {
    return { valido: true };
  }

  return {
    valido: false,
    errores: xmlDoc.validationErrors.map((err) => err.message.trim()),
  };
}

module.exports = { validarXML };