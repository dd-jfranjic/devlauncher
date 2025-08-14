# FISKAL-AI MIGRATION PLAN - KIRURŠKI PRECIZAN PRISTUP

## 🎯 CILJ
Integrirati postojeći fiskal-ai-wsl projekt u Dev Launcher BEZ mijenjanja njegove konfiguracije.

## ⚠️ KRITIČNI ZAHTJEVI
1. **NE MIJENJATI** postojeće portove (11509, 13128, 13633, 13649, itd.)
2. **NE MIJENJATI** Docker Compose konfiguraciju
3. **NE MIJENJATI** strukture projekta
4. **ZADRŽATI** sve postojeće skripte i aliase
5. **ZADRŽATI** sve postojeće volumes i podatke

## 📋 KORACI MIGRACIJE

### FAZA 1: BACKUP (OBAVEZNO!)
```bash
# 1. Backup cijelog projekta
cp -r /home/jfranjic/fiskal-ai-wsl /home/jfranjic/fiskal-ai-wsl-backup-$(date +%Y%m%d_%H%M%S)

# 2. Backup Docker volumes
docker run --rm -v fiskal-ai-wsl_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .
docker run --rm -v fiskal-ai-wsl_redis_data:/data -v $(pwd):/backup alpine tar czf /backup/redis_backup.tar.gz -C /data .
```

### FAZA 2: PRIPREMA DEV LAUNCHER-a

#### Kreirati novi tip projekta "external-import":
```typescript
// server/src/domain/project.ts
export enum ProjectTypeValues {
  BLANK = 'blank',
  NEXTJS = 'nextjs',
  WORDPRESS = 'wordpress',
  EXTERNAL_IMPORT = 'external-import'  // Novi tip
}
```

#### Kreirati import endpoint:
```typescript
// server/src/api/projects.ts
projectRouter.post('/import-external', async (req, res) => {
  const { 
    path,           // /home/jfranjic/fiskal-ai-wsl
    name,           // Fiskal AI
    slug,           // fiskal-ai
    dockerProject,  // fiskal-ai-wsl
    preservePorts   // true - koristi postojeće portove
  } = req.body;
  
  // Validirati da projekt postoji
  // Parsirati docker-compose.yml
  // Ekstraktovati portove
  // Kreirati entry u bazi BEZ mijenjanja ničega
})
```

### FAZA 3: INTEGRACIJA

#### 1. Dodati projekt u Dev Launcher bazu:
```json
{
  "name": "Fiskal AI",
  "slug": "fiskal-ai",
  "type": "external-import",
  "location": "wsl",
  "paths": {
    "host": "/home/jfranjic/fiskal-ai-wsl",
    "container": "/workspace",
    "relative": "fiskal-ai-wsl"
  },
  "ports": {
    "postgres": 11509,
    "redis": 13128,
    "backend": 13633,
    "frontend": 13649,
    "adminer": 13264,
    "mailpit_ui": 10451,
    "mailpit_smtp": 10393,
    "browser_context": 10625,
    "dozzle": 9999
  },
  "dockerProject": "fiskal-ai-wsl",
  "preserveOriginalConfig": true,
  "readOnly": true
}
```

#### 2. UI Prilagođenja:
- ProjectOverview komponenta treba prepoznati "external-import" tip
- Prikazati sve portove i servise
- Dodati custom akcije za fiskal.sh skriptu
- Disable sve opcije mijenjanja (read-only mode)

#### 3. Docker Operacije:
- Start: `cd /home/jfranjic/fiskal-ai-wsl && docker compose up -d`
- Stop: `cd /home/jfranjic/fiskal-ai-wsl && docker compose down`
- Logs: `cd /home/jfranjic/fiskal-ai-wsl && docker compose logs -f`
- NE koristiti Dev Launcher docker wrapper

### FAZA 4: CUSTOM AKCIJE

Dodati posebne akcije za fiskal.sh:
```typescript
// Custom buttons u ProjectOverview
const fiskalActions = [
  { label: "Hot Reload Backend", command: "./fiskal.sh hot backend" },
  { label: "Hot Reload Frontend", command: "./fiskal.sh hot frontend" },
  { label: "Database Migrate", command: "./fiskal.sh migrate" },
  { label: "View Logs", command: "./fiskal.sh logs all" },
  { label: "Fiskal Shell", command: "./fiskal.sh shell backend" }
];
```

### FAZA 5: TESTIRANJE

1. **Provjeri postojeće funkcionalnosti**:
   - Login sa admin@fiskal-ai.hr
   - Login sa demo@fiskal-ai.hr
   - Kreiranje računa
   - KPD generiranje

2. **Provjeri Dev Launcher integraciju**:
   - Terminal otvara u projektu
   - VS Code otvara projekt
   - Svi linkovi rade
   - Docker operacije rade

3. **Provjeri da NIŠTA nije pokvareno**:
   - Svi portovi ostaju isti
   - Docker compose nepromijenjen
   - Volumes očuvani
   - Podatci u bazi netaknuti

## 🚨 ROLLBACK PLAN

Ako bilo što pođe po zlu:
```bash
# 1. Stopiraj sve containere
docker compose -f /home/jfranjic/fiskal-ai-wsl/docker-compose.yml down

# 2. Vrati backup
rm -rf /home/jfranjic/fiskal-ai-wsl
cp -r /home/jfranjic/fiskal-ai-wsl-backup-[timestamp] /home/jfranjic/fiskal-ai-wsl

# 3. Pokreni ponovo
cd /home/jfranjic/fiskal-ai-wsl && docker compose up -d
```

## ✅ KRITERIJI USPJEHA
- [ ] Projekt vidljiv u Dev Launcheru
- [ ] Svi portovi ostaju isti (11509, 13633, 13649, itd.)
- [ ] Docker compose nepromijenjen
- [ ] Sve funkcionalnosti rade kao prije
- [ ] fiskal.sh skripte rade
- [ ] Hot reload radi
- [ ] Podatci u bazi očuvani
- [ ] Login sa postojećim korisnicima radi