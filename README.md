# 🏐 VoleyAssistant

Sistema de gestión de asistencia para entrenamientos de voleibol.

## 📋 Características

- ✅ Registro de asistencia de jugadores
- ✅ Gestión de jugadores (alta/baja/modificación)
- ✅ Gestión de entrenamientos configurables
- ✅ Categorías: Cadete, Juvenil, Junior, Senior
- ✅ Reportes en PDF y Excel
- ✅ Sistema de autenticación con roles
- ✅ Interfaz responsive (móvil/tablet/desktop)
- ✅ Despliegue con Docker

## 🚀 Instalación

### Requisitos previos
- Docker y Docker Compose instalados
- Puerto 3000 y 3001 disponibles

### Pasos

1. Clonar el repositorio:
```bash
git clone https://github.com/tu-usuario/voleyassistant.git
cd voleyassistant
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env con tus valores
```

3. Construir y levantar:
```bash
docker-compose up -d --build
```

4. Acceder a la aplicación:
- Frontend: http://localhost:4000
- Backend API: http://localhost:3001

## 🔧 Desarrollo local

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📱 Uso

### Primer acceso
1. Accede a la aplicación
2. Inicia sesión con las credenciales por defecto:
   - Email: admin@voleyassistant.com
   - Password: admin123
3. **¡Cambia la contraseña inmediatamente!**

### Gestión de jugadores
- Añade jugadores con nombre, apellidos, teléfono, posición y fecha de nacimiento
- Asigna una categoría a cada jugador
- Puedes dar de baja/alta jugadores según necesites

### Registro de asistencia
- Selecciona el entrenamiento del día
- Marca asistencia/ausencia de cada jugador
- Si un jugador no asiste, añade el motivo

### Reportes
- Genera reportes de asistencia en PDF o Excel
- Filtra por fechas, categorías o jugadores específicos

## 🐳 Configuración Docker para Proxmox

El sistema está optimizado para funcionar con ~500MB de RAM total.

### Puertos
- **4000**: Frontend (nginx)
- **3001**: Backend (API)

### HAProxy
Configura HAProxy para redirigir tu dominio a los puertos correspondientes.

## 📝 Licencia

MIT License
