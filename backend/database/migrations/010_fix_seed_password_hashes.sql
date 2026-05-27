-- Replace dev placeholder password hashes with bcrypt for TestPassword1!
UPDATE users
SET password_hash = '$2b$10$ADE5B3E8cyVg9CsCEsL6N.GGf3Yj/StZtrBcX1tbuTGcsXI3dh1D6'
WHERE password_hash LIKE '%testhashplaceholder%';
