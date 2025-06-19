import { tool, agent } from "llamaindex";
import { Ollama } from "@llamaindex/ollama";
import { z } from "zod";
import { empezarChat } from "./lib/cli-chat.js";
import { Estudiantes } from "./lib/estudiantes.js";

// Configuración
const DEBUG = true;

// Instancia de la clase Estudiantes
const estudiantes = new Estudiantes();
estudiantes.cargarEstudiantesDesdeJson();

// System prompt básico
const systemPrompt = `
Sos un asistente para gestionar estudiantes.
Tu tarea es ayudar a consultar o modificar una base de datos de alumnos.

Usá las herramientas disponibles para:
- Buscar estudiantes por nombre o apellido
- Agregar nuevos estudiantes
- Mostrar la lista completa de estudiantes

Respondé de forma clara y breve.
`.trim();

const ollamaLLM = new Ollama({
    model: "qwen3:1.7b",
    temperature: 0.75,
    timeout: 2 * 60 * 1000, // Timeout de 2 minutos
});


// TODO: Implementar la Tool para buscar por nombre
const buscarPorNombreTool = tool({
    name: "buscarPorNombre",
    description: "Busca estudiantes por nombre",
    parameters: z.object({
      nombre: z.string(),
    }),
    execute: ({ nombre }) => {
      const lista = estudiantes.buscarEstudiantePorNombre(nombre);
      if (lista.length === 0) {
        return "No se encontró ningún estudiante con ese nombre.";
      }
      return lista.map(e => `${e.nombre} ${e.apellido} - ${e.curso}`).join("\n");
    },
  });
  
  const buscarPorApellidoTool = tool({
    name: "buscarPorApellido",
    description: "Busca estudiantes por apellido",
    parameters: z.object({
      apellido: z.string(),
    }),
    execute: ({ apellido }) => {
      const lista = estudiantes.buscarEstudiantePorApellido(apellido);
      if (lista.length === 0) {
        return "No se encontró ningún estudiante con ese apellido.";
      }
      return lista.map(e => `${e.nombre} ${e.apellido} - ${e.curso}`).join("\n");
    },
  });
  
  const agregarEstudianteTool = tool({
    name: "agregarEstudiante",
    description: "Agrega un nuevo estudiante",
    parameters: z.object({
      nombre: z.string(),
      apellido: z.string(),
      curso: z.string(),
    }),
    execute: ({ nombre, apellido, curso }) => {
      estudiantes.agregarEstudiante(nombre, apellido, curso);
      return "Estudiante agregado correctamente.";
    },
  });
  
  const listarEstudiantesTool = tool({
    name: "listarEstudiantes",
    description: "Muestra todos los estudiantes",
    parameters: z.object({}),
    execute: () => {
      const todos = estudiantes.listarEstudiantes();
      if (todos.length === 0) {
        return "No hay estudiantes cargados.";
      }
      return todos.map(e => `${e.nombre} ${e.apellido} - ${e.curso}`).join("\n");
    },
  });

// Configuración del agente
const elAgente = agent({
    tools: [buscarPorNombreTool, buscarPorApellidoTool, agregarEstudianteTool, listarEstudiantesTool],
    llm: ollamaLLM,
    verbose: DEBUG,
    systemPrompt: systemPrompt,
});

// Mensaje de bienvenida
const mensajeBienvenida = `
¡Hola! Soy tu asistente para gestionar estudiantes.
Puedo ayudarte a:
- Buscar estudiantes por nombre o apellido
- Agregar nuevos estudiantes
- Mostrar la lista completa de estudiantes

¿Qué necesitás?
`;

// Iniciar el chat
empezarChat(elAgente, mensajeBienvenida);