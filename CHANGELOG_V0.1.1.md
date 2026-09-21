# Pekahellix Client V0.1.1

- Remplacement des 11 boutons NPS par un curseur 0–10 responsive.
- Valeur et libellé dynamiques au-dessus du curseur.
- Extrémités 0 « Pas du tout probable » et 10 « Tout à fait probable ».
- Palette Pekahellix orange → vert, curseur bleu.
- Aucune valeur NPS n'est enregistrée tant que l'utilisateur n'a pas manipulé le curseur.
- Format envoyé à Supabase inchangé (`NPS-01`, entier 0–10) : aucune migration SQL nécessaire.
- Cache Service Worker incrémenté en V0.1.1.
