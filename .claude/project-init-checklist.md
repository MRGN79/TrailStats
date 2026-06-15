# Checklist de Inicio de Proyecto

Usar este checklist al crear un proyecto nuevo desde el scaffold.
Completarlo en orden — cada paso prepara el terreno para el siguiente.

---

## Día 0 — Antes de escribir una línea de código

### Definición del proyecto
- [ ] Nombre del proyecto definido
- [ ] Descripción en una frase: "Este proyecto es un [X] que [hace Y] para [quién]"
- [ ] Audiencia objetivo identificada (tipo de usuarios, nivel técnico, geografías)
- [ ] Mercados / jurisdicciones objetivo (determina qué regulación aplica al Abogado — si no se define, el Abogado asume España/UE como marco regulatorio por defecto)
- [ ] Requisitos de disponibilidad: ¿el proyecto necesita SLA de disponibilidad? (default: no, salvo que el usuario lo especifique) — si sí, definir objetivo de uptime e impacto aceptable de downtime; el Arquitecto definirá los SLOs correspondientes
- [ ] Idiomas adicionales al EN + ES base (si aplican)
- [ ] Si el proyecto tiene interfaz de usuario o audiencia externa: invocar al **Growth** (modo consultor) para análisis de potencial comercial — el dictamen puede influir en el diseño y las specs antes de comprometerse con una dirección técnica

### Repositorio y acceso
- [ ] Repositorio creado en GitHub (o proveedor elegido), privado inicialmente
- [ ] Accesos configurados (quién puede leer, quién puede escribir, quién puede administrar)
- [ ] Branch protection en `main`: requerir PR + CI verde + al menos una revisión
- [ ] Plantilla de PR activa (ya incluida en `.github/PULL_REQUEST_TEMPLATE.md`)
- [ ] Issue templates activos (ya incluidos en `.github/ISSUE_TEMPLATE/`)

### Stack y arquitectura
- [ ] Invocar al **Arquitecto** para definir el stack tecnológico → genera ADR-001
- [ ] Invocar al **DevOps** para diseñar el pipeline CI/CD y la estrategia de entornos
- [ ] Invocar al **Arquitecto** para definir la solución i18n (librería o nativa)
- [ ] Implementar la solución i18n en el stack: instalar la librería o configurar la solución nativa según el ADR
- [ ] Crear la estructura base de locales: `/locales/en/` y `/locales/es/` con los archivos de traducción iniciales
- [ ] Si el proyecto tiene interfaz, invocar a **UX-UI** para definir el sistema de diseño base (paleta, tipografía, espaciado)
- [ ] Primer ADR creado: `docs/decisions/ADR-001-eleccion-de-stack.md`

### Entornos y secretos
- [ ] Entornos creados: development, staging, production
- [ ] Variables de entorno definidas y documentadas en `.env.example`
- [ ] Secretos configurados en el gestor elegido (GitHub Secrets, Vault, etc.)
- [ ] CI/CD pipeline configurado y verde con un commit vacío de prueba

### Observabilidad base
- [ ] Error tracking configurado (Sentry o equivalente) — antes del primer deploy real
- [ ] Logging estructurado implementado
- [ ] Health check endpoint (`/health`) implementado

### Documentación inicial
- [ ] README creado con las secciones mínimas obligatorias (¿Qué es esto?, Stack, Requisitos previos, Instalación, Variables de entorno, Cómo ejecutar, Tests, Estructura del proyecto, Desplegar, Contribuir — ver agente Documentación para el detalle de cada sección)
- [ ] `CHANGELOG.md` creado con sección `[Unreleased]` (usar plantilla en `.claude/templates/CHANGELOG.md`)
- [ ] `.env.example` con todas las variables necesarias

### Legal y privacidad
- [ ] Invocar al **Abogado** en modo inicialización: proporcionar contexto del proyecto (tipo de usuarios, mercados, datos que se tratarán, stack tecnológico, intención comercial presente o futura)
- [ ] El Abogado confirma qué regulación aplica y qué documentos legales serán necesarios (política de privacidad, ToS, etc.)
- [ ] El Abogado revisa y valida el fichero `LICENSE` **antes de hacer el primer commit público**: ¿MIT, propietaria, source-available, dual? La elección depende de la intención comercial — cambiarla retroactivamente es posible pero más costoso. Un `LICENSE` incorrecto en el repositorio desde el día 1 concede permisos que pueden ser difíciles de revocar.
- [ ] El Abogado revisa las licencias de las dependencias principales del stack elegido y confirma que son compatibles con la licencia del proyecto.

---

## Antes del primer deploy a producción

- [ ] Invocar al **Tester** para que ejecute la suite completa de tests y emita informe sin fallos
- [ ] Todos los gates de release han pasado al menos una vez: QA, Seguridad, Accesibilidad, Responsabilidad Social, Documentación, Abogado
- [ ] Backups de base de datos configurados y testados
- [ ] Alertas básicas configuradas (errores críticos, disponibilidad)
- [ ] Plan de rollback definido y documentado
- [ ] README refleja el estado real del proyecto

---

## Notas del proyecto

<!-- Usar esta sección para capturar decisiones o contexto específico
     de este proyecto que no encaja en un ADR formal -->
