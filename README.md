# Pekahellix Client — V0.1

PWA publique et distincte de Pekahellix OS pour recueillir anonymement la perception des clients d'un commerce.

## Installation
1. Exécuter `SUPABASE_PEKAHELLIX_CLIENT_V0.1.sql` dans le projet Supabase utilisé par Pekahellix OS H.2.x.
2. Renseigner dans `config.js` la même URL Supabase et la même publishable key publique que Pekahellix OS. Ne jamais y mettre de clé `service_role`.
3. Créer une campagne dans Supabase (exemple en bas du SQL) et récupérer son `public_code`.
4. Déployer ce dossier sur un hébergement HTTPS (GitHub Pages convient).
5. Le lien public est : `https://votre-domaine/.../?c=PUBLIC_CODE`. Générer le QR code à partir de ce lien.

## Questionnaire
- EXT-01 Clarté & efficacité
- EXT-02 Image & cohérence
- EXT-03 Accueil & relation client
- EXT-04 Écoute & réactivité
- EXT-05 Ancrage local
- EXT-06 Attractivité & fidélisation
- NPS 0–10
- 2 questions qualitatives facultatives

## Confidentialité / accès
Le navigateur public peut uniquement :
- résoudre un code de campagne actif vers le nom du commerce ;
- soumettre une réponse anonyme.

Les tables ne sont pas lisibles directement par `anon` ou `authenticated`. La RPC de rapport Client exige un profil actif avec `role='admin'`. Aucun accès de restitution n'est accordé au gérant.

## Service Worker
Le Service Worker ne traite que les requêtes GET de même origine. Les appels Supabase, cross-origin, ne sont ni interceptés ni mis en cache.
