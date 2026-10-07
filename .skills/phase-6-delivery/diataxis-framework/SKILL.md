---
name: diataxis-framework
description: Arquitectura de información formal para documentación de software (diataxis.fr). Organiza el contenido en Tutoriales, How-To, Referencia y Explicación.
---

# Diátaxis Documentation Framework

Framework canónico de estructuración documental técnica adoptado por Canonical, Python, NumPy y Luna-Vet.

## Estructura de Cuadrantes

```
                     PRÁCTICO
                        ▲
                        │
       Tutoriales       │       How-To Guides
  (Aprender haciendo)   │  (Resolver problema concreto)
                        │
◄───────────────────────┼────────────────────────► TEÓRICO
                        │
       Explicación      │         Referencia
   (Comprender por qué) │   (Información pura / APIs)
                        │
                        ▼
```

### Criterios de Separación
- **Nunca mezclar Referencia con Tutoriales**: La referencia no debe narrar; debe describir firmas, tipos y contratos de forma determinista.
- **How-To Guides**: Asumen competencia técnica del lector y van directo a los pasos 1, 2, 3 sin introducciones teóricas.
