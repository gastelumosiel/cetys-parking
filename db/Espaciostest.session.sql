

-- @block
CREATE TABLE EntradasSalidas(
    id INT PRIMARY KEY AUTO_INCREMENT,
    parkingId VARCHAR(2),
    spotId INT,
    spotNumber VARCHAR(5),
    estado VARCHAR(9),
    ttimestamp BIGINT
);

-- @block
INSERT INTO EntradasSalidas(parkingId, spotId, spotNumber, estado, ttimestamp)
VALUES(
    '2',
    1,
    'PS001',
    'libre',
    1700000000000
);

-- @block
SELECT * FROM EntradasSalidas;

-- @block
TRUNCATE TABLE entradassalidas;

-- @block
DROP TABLE EntradasSalidas;