-- Correct EXP values for Major → Grand Marshall
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/qywburkldwdkegztsgjj/editor

UPDATE ranks SET exp_required = 2057701 WHERE name = 'Major' AND tier = 52;
UPDATE ranks SET exp_required = 2107237 WHERE name = 'Major' AND tier = 53;
UPDATE ranks SET exp_required = 2339509 WHERE name = 'Major' AND tier = 54;
UPDATE ranks SET exp_required = 2484517 WHERE name = 'Major' AND tier = 55;
UPDATE ranks SET exp_required = 2632261 WHERE name = 'Major' AND tier = 56;
UPDATE ranks SET exp_required = 2782741 WHERE name = 'Major' AND tier = 57;
UPDATE ranks SET exp_required = 2935957 WHERE name = 'Major' AND tier = 58;
UPDATE ranks SET exp_required = 3091909 WHERE name = 'Major' AND tier = 59;

UPDATE ranks SET exp_required = 3277045 WHERE name = 'Lieutenant Colonel' AND tier = 60;
UPDATE ranks SET exp_required = 3465373 WHERE name = 'Lieutenant Colonel' AND tier = 61;
UPDATE ranks SET exp_required = 3673537 WHERE name = 'Lieutenant Colonel' AND tier = 62;
UPDATE ranks SET exp_required = 3885178 WHERE name = 'Lieutenant Colonel' AND tier = 63;
UPDATE ranks SET exp_required = 4100296 WHERE name = 'Lieutenant Colonel' AND tier = 64;
UPDATE ranks SET exp_required = 4318891 WHERE name = 'Lieutenant Colonel' AND tier = 65;
UPDATE ranks SET exp_required = 4540963 WHERE name = 'Lieutenant Colonel' AND tier = 66;
UPDATE ranks SET exp_required = 4766512 WHERE name = 'Lieutenant Colonel' AND tier = 67;

UPDATE ranks SET exp_required = 5028199 WHERE name = 'Colonel' AND tier = 68;
UPDATE ranks SET exp_required = 5319184 WHERE name = 'Colonel' AND tier = 69;
UPDATE ranks SET exp_required = 5614501 WHERE name = 'Colonel' AND tier = 70;
UPDATE ranks SET exp_required = 5914150 WHERE name = 'Colonel' AND tier = 71;
UPDATE ranks SET exp_required = 6218131 WHERE name = 'Colonel' AND tier = 72;
UPDATE ranks SET exp_required = 6526501 WHERE name = 'Colonel' AND tier = 73;
UPDATE ranks SET exp_required = 6839203 WHERE name = 'Colonel' AND tier = 74;
UPDATE ranks SET exp_required = 7156237 WHERE name = 'Colonel' AND tier = 75;

UPDATE ranks SET exp_required = 7578037  WHERE name = 'Brigadier General' AND tier = 76;
UPDATE ranks SET exp_required = 8026912  WHERE name = 'Brigadier General' AND tier = 77;
UPDATE ranks SET exp_required = 8481772  WHERE name = 'Brigadier General' AND tier = 78;
UPDATE ranks SET exp_required = 8964562  WHERE name = 'Brigadier General' AND tier = 79;
UPDATE ranks SET exp_required = 9475852  WHERE name = 'Brigadier General' AND tier = 80;
UPDATE ranks SET exp_required = 10016212 WHERE name = 'Brigadier General' AND tier = 81;

UPDATE ranks SET exp_required = 10586212 WHERE name = 'Major General' AND tier = 82;
UPDATE ranks SET exp_required = 11186422 WHERE name = 'Major General' AND tier = 83;
UPDATE ranks SET exp_required = 11817412 WHERE name = 'Major General' AND tier = 84;
UPDATE ranks SET exp_required = 12479752 WHERE name = 'Major General' AND tier = 85;
UPDATE ranks SET exp_required = 13174012 WHERE name = 'Major General' AND tier = 86;
UPDATE ranks SET exp_required = 13900762 WHERE name = 'Major General' AND tier = 87;

UPDATE ranks SET exp_required = 14660572 WHERE name = 'Lieutenant General' AND tier = 88;
UPDATE ranks SET exp_required = 15454012 WHERE name = 'Lieutenant General' AND tier = 89;
UPDATE ranks SET exp_required = 16281652 WHERE name = 'Lieutenant General' AND tier = 90;
UPDATE ranks SET exp_required = 17144062 WHERE name = 'Lieutenant General' AND tier = 91;
UPDATE ranks SET exp_required = 18041812 WHERE name = 'Lieutenant General' AND tier = 92;
UPDATE ranks SET exp_required = 18975472 WHERE name = 'Lieutenant General' AND tier = 93;

UPDATE ranks SET exp_required = 19945612 WHERE name = 'General' AND tier = 94;
UPDATE ranks SET exp_required = 20952802 WHERE name = 'General' AND tier = 95;
UPDATE ranks SET exp_required = 21997612 WHERE name = 'General' AND tier = 96;
UPDATE ranks SET exp_required = 23080612 WHERE name = 'General' AND tier = 97;
UPDATE ranks SET exp_required = 24202372 WHERE name = 'General' AND tier = 98;
UPDATE ranks SET exp_required = 25363462 WHERE name = 'General' AND tier = 99;

-- Marshall (100) and Grand Marshall (104) already have correct values — no change needed.
