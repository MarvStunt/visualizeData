# Projet visualisation de données - Master 2 MIAGE MBDS (2025-2026)

## Auteurs
- Marvin CONIL
- Alex ARMATYS
- Erwan HAIN
- Mateus LOPES

## Pré-requis
- Python 3.x
- Bibliothèques Python : pandas, numpy (installer via `pip install pandas numpy`)
- Unzip (pour décompresser les fichiers de données)
- Un navigateur web moderne (Chrome, Firefox, etc.)

## Lancement du projet
1. Cloner le dépôt GitHub :
   ```bash
   git clone <URL_DU_DEPOT>
    cd <NOM_DU_REPERTOIRE>
    ```
2. Dezipper les fichiers de données :
   ```bash
   unzip ./globalterrorismdb_0718dist.zip -d data/
    ```
3. Déplacer le csv à la racine du projet :
   ```bash
   mv globalterrorismdb_0718dist/globalterrorismdb_0718dist.csv ./
    ```
4. Executer le script Python pour avoir les données pré-traitées :
   ```bash
    python3 clean_script.py
    ```
5. Lancer un serveur local pour visualiser le projet (par exemple avec `python -m http.server`) :
   ```bash
   python -m http.server 8000
   ```
6. Ouvrir un navigateur web et accéder à l'adresse suivante :
   ```bash
   http://localhost:8000
   ```