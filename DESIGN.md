---
version: "alpha"
name: "Atlassian Design System"
description: "Atlassian's design language built around clarity, consistency, and purposeful density for operational tools."
colors:
  primary: "#1868DB"
  primary-hover: "#0055CC"
  primary-active: "#09326C"
  surface: "#FFFFFF"
  background: "#F7F8F9"
  border: "#DCDFE4"
  text-primary: "#172B4D"
  text-secondary: "#44546F"
  text-inverse: "#FFFFFF"
  success: "#216E4E"
  success-subtle: "#E3FCEF"
  warning: "#7F5F01"
  warning-subtle: "#FFFAE6"
  danger: "#CA3521"
  danger-subtle: "#FFEBE6"
  discovery: "#5243AA"
  discovery-subtle: "#EAE6FF"
  info: "#165561"
  info-subtle: "#E6FCFF"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', Ubuntu, 'Helvetica Neue', sans-serif"
    fontSize: 35px
    fontWeight: 500
    lineHeight: 40px
  h1:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', Ubuntu, 'Helvetica Neue', sans-serif"
    fontSize: 29px
    fontWeight: 600
    lineHeight: 32px
  h2:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', Ubuntu, 'Helvetica Neue', sans-serif"
    fontSize: 24px
    fontWeight: 500
    lineHeight: 28px
  h3:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', Ubuntu, 'Helvetica Neue', sans-serif"
    fontSize: 20px
    fontWeight: 500
    lineHeight: 24px
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', Ubuntu, 'Helvetica Neue', sans-serif"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  small:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', Ubuntu, 'Helvetica Neue', sans-serif"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
  mono:
    fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace"
    fontSize: 12px
    fontWeight: 400
    lineHeight: 16px
rounded:
  sm: 3px
  md: 4px
  lg: 8px
  xl: 12px
spacing:
  space-100: 8px
  space-200: 16px
  space-300: 24px
  space-400: 32px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-inverse}"
    rounded: "{rounded.sm}"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.text-inverse}"
  button-primary-active:
    backgroundColor: "{colors.primary-active}"
    textColor: "{colors.text-inverse}"
  surface-card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
  app-page:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text-primary}"
  subtle-badge:
    backgroundColor: "{colors.border}"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.sm}"
  badge-success:
    backgroundColor: "{colors.success-subtle}"
    textColor: "{colors.success}"
    rounded: "{rounded.sm}"
  badge-warning:
    backgroundColor: "{colors.warning-subtle}"
    textColor: "{colors.warning}"
    rounded: "{rounded.sm}"
  badge-danger:
    backgroundColor: "{colors.danger-subtle}"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
  badge-discovery:
    backgroundColor: "{colors.discovery-subtle}"
    textColor: "{colors.discovery}"
    rounded: "{rounded.sm}"
  badge-info:
    backgroundColor: "{colors.info-subtle}"
    textColor: "{colors.info}"
    rounded: "{rounded.sm}"
---

## Overview

Atlassian's design language is built around **clarity**, **consistency**, and **purposeful density**. It serves millions of users across products like Jira, Confluence, Trello, and Bitbucket.

## Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Blue 700 (`primary`) | `#1868DB` | Primary actions, links, focus states |
| Blue 800 (`primary-hover`) | `#0055CC` | Hover states |
| Blue 900 (`primary-active`) | `#09326C` | Active/pressed states |
| Neutral 0 (`surface`) | `#FFFFFF` | Surface backgrounds |
| Neutral 100 (`background`) | `#F7F8F9` | Secondary backgrounds |
| Neutral 200 (`border`) | `#DCDFE4` | Borders, dividers |
| Neutral 800 (`text-primary`) | `#172B4D` | Primary text |
| Neutral 600 (`text-secondary`) | `#44546F` | Secondary text |

### Status Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Green 700 (`success`) | `#216E4E` | Success states and text |
| Yellow 600 (`warning`) | `#7F5F01` | Warning states and text |
| Red 700 (`danger`) | `#CA3521` | Error states |
| Purple 700 (`discovery`) | `#5243AA` | Discovery, new features |
| Teal 600 (`info`) | `#165561` | Information states |

## Typography

**Primary Font:** Atlassian Sans (proprietary), falling back to system fonts: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans', Ubuntu, 'Helvetica Neue', sans-serif`

**Monospace:** Menlo, Monaco, Consolas, 'Courier New', monospace

### Type Scale

| Role | Size | Line Height | Weight |
|------|------|-------------|--------|
| Display | 35px | 40px | 500 |
| Heading 1 | 29px | 32px | 600 |
| Heading 2 | 24px | 28px | 500 |
| Heading 3 | 20px | 24px | 500 |
| Body | 14px | 20px | 400 |
| Small | 12px | 16px | 400 |

## Layout

Based on an 8px grid system:
- `space.100` = 8px
- `space.200` = 16px
- `space.300` = 24px
- `space.400` = 32px

Standard container width with responsive gutters and compact vertical rhythm.

## Elevation & Depth

- Base Layer: `#F7F8F9`
- Card Surface: `#FFFFFF` with `1px solid #DCDFE4` border and subtle shadow `0 1px 1px rgba(9, 30, 66, 0.25), 0 0 1px 1px rgba(9, 30, 66, 0.13)`
- Modal & Overlay: Raised elevation `0 8px 16px -4px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)`

## Shapes

- Small: `3px` for buttons, badges, and form tags
- Medium: `4px` for inputs and select controls
- Large: `8px` for cards, tables, and grouped panels
- Extra Large: `12px` for dialogs and prominent modals

## Components

- **Buttons**:
  - Primary: Blue 700 background (`#1868DB`), white text, 3px border radius
  - Secondary/Default: Neutral background with subtle border, Neutral 800 text
  - Subdued/Ghost: Transparent with hover states
- **Inputs & Selects**: Neutral 0 (`#FFFFFF`) background, Neutral 200 (`#DCDFE4`) border, focus ring with Blue 700 (`#1868DB`)
- **Badges / Lozenge**: Compact, uppercase or sentence case with rounded-sm, colored subtle background and text
- **Tables**: Clean header with Neutral 600 uppercase text, Neutral 200 row borders, comfortable tabular spacing

## Do's and Don'ts

### Do's
- Use Blue 700 for primary interactive elements
- Maintain 4.5:1 contrast ratio for text
- Use consistent spacing from the 8px grid

### Don'ts
- Don't use color alone to convey meaning
- Don't use custom fonts outside the type system
- Don't create custom button styles
