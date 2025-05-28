import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

// 1. Crear el servidor
// Es la interfaz principal con el protocolo MCP. Maneja la comunicación entre el cliente y el servidor.
const server = new McpServer({
  name: 'Demo',
  version: '1.0.0'
})

// 2. Definir las herramientas
// Las herramientas le permiten al LLM realizar acciones a traves del servidor.
server.tool(
  'fetch-weather', // titulo de la herramienta
  'Tool to fetch the weather of a city', // descripción de la herramienta
  { city: z.string().describe('City name') },
  async ({ city }) => {
    // lo que queramos que haga
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1&language=en&format=json`
    )
    const data = await response.json()

    if (!data.results) {
      return {
        content: [
          {
            type: 'text',
            text: `No se encontró información para la ciudad ${city}`
          }
        ]
      }
    }

    const { latitude, longitude } = data.results[0]

    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&hourly=temperature_2m&current=temperature_2m,precipitation,is_day&forecast_days=1`
    )

    const weatherData = await weatherResponse.json()

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(weatherData, null, 2)
        }
      ]
    }
  }
)

// 3. Escuchar las conexiones del cliente
// Start receiving messages on stdin and sending messages on stdout
const transport = new StdioServerTransport()
await server.connect(transport)
