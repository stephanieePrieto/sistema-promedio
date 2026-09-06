

const fs = require('fs').promises;
const path = require('path');
const xml2js = require('xml2js');

const XML_PATH = path.join(__dirname, '..', 'data', 'estudiantes.xml');

let validarXML;
try {
  ({ validarXML } = require('./validador'));
} catch (err) {
  console.warn(
    '[xmlManager] Aviso: no se encontró services/validador.js. ' +
    'Usando validación temporal (siempre "válida") hasta que el Integrante 1 suba su archivo.'
  );
  validarXML = () => ({ valido: true });
}

const parserOptions = {
  explicitArray: false, 
  trim: true
};

function comoArreglo(valor) {
  if (valor === undefined || valor === null || valor === '') return [];
  return Array.isArray(valor) ? valor : [valor];
}

function normalizarMateria(materiaCruda) {
  const tieneCalificacion =
    materiaCruda.calificacion !== undefined && materiaCruda.calificacion !== '';

  return {
    id: parseInt(materiaCruda.id, 10),
    nombre: materiaCruda.nombre,
    creditos: parseInt(materiaCruda.creditos, 10),
    calificacion: tieneCalificacion ? parseFloat(materiaCruda.calificacion) : null
  };
}

function normalizarEstudiante(estudianteCrudo) {
  const materiasCrudas = comoArreglo(
    estudianteCrudo.materias && estudianteCrudo.materias.materia
  );

  return {
    matricula: estudianteCrudo.matricula,
    nombre: estudianteCrudo.nombre,
    materias: materiasCrudas.map(normalizarMateria)
  };
}

/**
 * @returns {Promise<{estudiantes: Array}>}
 */
async function obtenerDatos() {
  const contenidoXML = await fs.readFile(XML_PATH, 'utf-8');
  const resultado = await xml2js.parseStringPromise(contenidoXML, parserOptions);

  if (!resultado || !resultado.sistema) {
    return { estudiantes: [] };
  }

  const estudiantesCrudos = comoArreglo(resultado.sistema.estudiante);
  const estudiantes = estudiantesCrudos.map(normalizarEstudiante);

  return { estudiantes };
}

function objetoADocumentoXML(datos) {
  return {
    sistema: {
      estudiante: (datos.estudiantes || []).map((est) => {
        const materiasXML = (est.materias || []).map((m) => {
          const materiaXML = {
            id: m.id,
            nombre: m.nombre,
            creditos: m.creditos
          };
          if (m.calificacion !== null && m.calificacion !== undefined) {
            materiaXML.calificacion = m.calificacion;
          }
          return materiaXML;
        });

        return {
          matricula: est.matricula,
          nombre: est.nombre,
          materias: { materia: materiasXML }
        };
      })
    }
  };
}

/**
 * @param {{estudiantes: Array}} datos
 * @throws {Error} 
 */
async function guardarDatos(datos) {
  const documentoJS = objetoADocumentoXML(datos);

  const builder = new xml2js.Builder({
    xmldec: { version: '1.0', encoding: 'UTF-8' }
  });
  const xmlString = builder.buildObject(documentoJS);

  const resultadoValidacion = await Promise.resolve(validarXML(xmlString));

  if (!resultadoValidacion.valido) {
    const detalles = (resultadoValidacion.errores || []).join(' | ');
    throw new Error(
      `No se guardaron los cambios: el XML generado no cumple con el esquema. ${detalles}`
    );
  }

  await fs.writeFile(XML_PATH, xmlString, 'utf-8');
}

module.exports = {
  obtenerDatos,
  guardarDatos
};