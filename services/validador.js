const path = require('path');
const fs = require('fs');

let libxmljs = null;
let xsdDoc = null;

try {
  libxmljs = require('libxmljs2');
  const rutaXSD = path.join(__dirname, '..', 'schema', 'sistema.xsd');
  if (fs.existsSync(rutaXSD)) {
    xsdDoc = libxmljs.parseXml(fs.readFileSync(rutaXSD, 'utf8'));
  }
} catch (e) {
  // Manejo alternativo si libxmljs2 no compila en el entorno
}

function validarXML(xmlString) {
  const errores = [];

  // Validación oficial vía XSD con libxmljs2 si está disponible
  if (libxmljs && xsdDoc) {
    try {
      const xmlDoc = libxmljs.parseXml(xmlString);
      if (!xmlDoc.validate(xsdDoc)) {
        return {
          valido: false,
          errores: xmlDoc.validationErrors.map(err => err.message.trim())
        };
      }
      return { valido: true };
    } catch (err) {
      return { valido: false, errores: [`XML mal formado: ${err.message}`] };
    }
  }

  // Validación semántica detallada para el usuario
  const regexMatricula = /<matricula>(.*?)<\/matricula>/g;
  const patronMatricula = /^[Ss](0[0-9]|1[0-9]|2[0-6])[0-9]{6}$/;
  let m;

  while ((m = regexMatricula.exec(xmlString)) !== null) {
    const mat = m[1].trim();
    if (!patronMatricula.test(mat)) {
      errores.push(`La matrícula "${mat}" es inválida. Formato requerido: Letra 'S' o 's', año de ingreso entre 00 y 26, y 6 dígitos numéricos (Ejemplo: S24013375).`);
    }
  }

  const regexCreditos = /<creditos>(.*?)<\/creditos>/g;
  while ((m = regexCreditos.exec(xmlString)) !== null) {
    const cred = parseInt(m[1].trim(), 10);
    if (isNaN(cred) || cred < 1 || cred > 25) {
      errores.push(`Los créditos (${m[1]}) están fuera del rango permitido institucional (1 a 25 créditos).`);
    }
  }

// Validar calificacion: enteros de 0 a 100
  const regexCalif = /<calificacion>(.*?)<\/calificacion>/g;
  while ((m = regexCalif.exec(xmlString)) !== null) {
    const textoCalif = m[1].trim();
    const esEnteroPuro = /^(100|[0-9]{1,2})$/.test(textoCalif);
    const cal = parseInt(textoCalif, 10);

    if (!esEnteroPuro || isNaN(cal) || cal < 0 || cal > 100) {
      errores.push(`La calificación (${textoCalif}) es inválida. Debe ser un número entero sin decimales entre 0 y 100.`);
    }
  }

  return {
    valido: errores.length === 0,
    errores
  };
}

module.exports = { validarXML };