-- ============================================
-- AGREGAR CENTROS DE ACOGIDA SEDEGES
-- ============================================

-- Agregar los centros de acogida de SEDEGES
INSERT INTO destinos (nombre, descripcion, responsable) VALUES 
-- Centros de Acogida
('Centro de Acogida Niño Jesús', 'Centro de Acogida para niños y adolescentes', 'Director del Centro'),
('Centro de Acogida María Esther Quevedo', 'Centro de Acogida especializado', 'Director del Centro'),
('Centro de Acogida José Soria (Ex Mixto La Paz)', 'Centro de Acogida José Soria', 'Director del Centro'),
('Instituto de Adaptación Infantil (IDAI)', 'Instituto de Adaptación Infantil', 'Director del Instituto'),
('Centro para la Persona con Discapacidad Kallutaca', 'Centro especializado en discapacidad', 'Director del Centro'),
('Centro Rosaura Campos', 'Centro de atención especializada', 'Director del Centro'),
('Centro de Acogida para Personas con Discapacidad Yanacachi', 'Centro especializado Yanacachi', 'Director del Centro'),
('Centro de Reintegración Social para Adolescentes Mujeres', 'Centro de reintegración social', 'Director del Centro'),
('Centro de Acogida Félix Méndez Arcos (CAFMA)', 'Centro de Acogida CAFMA', 'Director del Centro'),
('Instituto para Personas con Discapacidad Erick Boulter', 'Instituto Erick Boulter', 'Director del Instituto'),
('Centro de Reintegración Social para Adolescentes Varones', 'Centro de reintegración varones', 'Director del Centro'),
('Centro de Acogida para Víctimas Refugio Dignidad', 'Centro Refugio Dignidad', 'Director del Centro'),

-- Direcciones Administrativas
('Dirección Departamental La Paz', 'Dirección Departamental principal', 'Director Departamental'),
('Subdirección General', 'Subdirección General SEDEGES', 'Subdirector General'),
('Jefatura de Unidad', 'Jefatura de Unidad específica', 'Jefe de Unidad'),
('Secretaría Departamental', 'Secretaría del Departamento', 'Secretario Departamental'),
('Departamento Legal', 'Área Jurídica', 'Jefe Legal'),
('Recursos Humanos', 'Gestión de Personal', 'Jefe de RR.HH.'),
('Contabilidad', 'Área Financiera', 'Contador General'),
('Archivo Central', 'Archivo institucional', 'Archivista'),
('Unidad de Sistemas', 'Informática y Sistemas', 'Jefe de Sistemas'),
('Comunicación Social', 'Área de Comunicación', 'Jefe de Comunicación'),

-- Otros destinos frecuentes
('Defensoría de la Niñez y Adolescencia', 'DNA', 'Defensor'),
('Ministerio de Justicia', 'Ministerio de Justicia', 'Ministro'),
('Gobernación del Departamento', 'Gobierno Departamental', 'Gobernador'),
('Alcaldía Municipal', 'Gobierno Municipal', 'Alcalde');

-- Marcar los centros de acogida con un tipo especial
ALTER TABLE destinos ADD COLUMN tipo VARCHAR(50) DEFAULT 'administrativo';

-- Actualizar tipos
UPDATE destinos SET tipo = 'centro_acogida' WHERE nombre LIKE '%Centro%' OR nombre LIKE '%Instituto%';
UPDATE destinos SET tipo = 'direccion' WHERE nombre LIKE '%Dirección%' OR nombre LIKE '%Subdirección%' OR nombre LIKE '%Jefatura%' OR nombre LIKE '%Secretaría%';
UPDATE destinos SET tipo = 'departamento' WHERE nombre IN ('Departamento Legal', 'Recursos Humanos', 'Contabilidad', 'Archivo Central', 'Unidad de Sistemas', 'Comunicación Social');
UPDATE destinos SET tipo = 'externo' WHERE nombre LIKE '%Defensoría%' OR nombre LIKE '%Ministerio%' OR nombre LIKE '%Gobernación%' OR nombre LIKE '%Alcaldía%';