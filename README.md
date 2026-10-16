# Marcos instantáneos

PWA para editar fotos y ponerles un marco estilo instantánea. Lee los metadatos EXIF de la cámara y puede imprimirlos en el marco. Todo el procesamiento ocurre en el navegador; las fotos no se suben a ningún servidor.

## Funciones

- **Editar**: histograma RGB, estilos rápidos, luz (exposición, contraste, altas luces, sombras, blancos, negros), color (temperatura, matiz, intensidad, saturación), mezcla de color HSL por 8 tonos, efectos (claridad, desvanecido, viñeta, grano) y nitidez.
- **Recortar**: proporciones, girar, espejo, enderezar, acercar y encuadrar arrastrando la foto.
- **Marco**: instantánea (Clásico, Panorámico, Mini), Franja y Galería (datos a izquierda y derecha), Desenfoque (fondo desenfocado de la propia foto, proporciones 1:1, 4:5, 9:16 y 16:9, borde y sombra), Sobre la foto y sin marco. Texto propio con tres tipos de letra.
- **Datos impresos editables**: cámara, objetivo, exposición y fecha se llenan desde el EXIF y se pueden corregir o dejar vacíos.
- **Datos**: EXIF completo, con ubicación GPS y enlace a OpenStreetMap.
- **Collage** de hasta 9 fotos: distribuciones en filas y columnas según el número de fotos, proporciones 1:1, 4:5, 3:4, 9:16, 3:2 y 16:9, fondo de color, degradado o foto desenfocada, espaciado, margen, esquinas redondeadas y texto. Cada foto se encuadra arrastrándola, tiene zoom y ajustes propios, y se puede mover, reemplazar o quitar.
- Deshacer/rehacer (Ctrl/Cmd+Z, Ctrl/Cmd+Mayús+Z) y comparar con el original (`\`).
- Exportar en JPG o PNG a resolución completa (máx. 16 MP), conservando el EXIF original en JPG y, opcionalmente, el GPS.
- Instalable y funciona sin conexión.

## Requisitos

- Node.js 20 o superior

## Instalación

```bash
npm install
```

## Ejecución

```bash
npm run dev       # desarrollo
npm run build     # compilación de producción en dist/
npm run preview   # sirve la compilación (el service worker sólo funciona aquí o en producción)
```

Para instalarla en el móvil debe servirse por HTTPS. En la red local: `npm run preview -- --host` y abrirla desde el teléfono (para instalar como PWA hace falta HTTPS, por ejemplo con un túnel o desplegando `dist/` en un hosting estático).

## Variables de entorno

No requiere ninguna.

## Notas

- Las fotos HEIC sólo se abren en Safari; en otros navegadores conviértelas a JPG.
- Las capturas de pantalla y las fotos enviadas por apps de mensajería suelen venir sin EXIF.
