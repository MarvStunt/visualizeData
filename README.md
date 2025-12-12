# Introduction


# Description du jeu de données et droits d'utilisation

Le "Global Terrorism Database" (GTD) est une base de données incluant des informations sur 180 000 attaques terroristes à travers le monde entre 1970 et 2017 (à l'exception de l'année 1993). Elle est maintenue par des chercheurs du National Consortium for the Study of Terrorism and Responses to Terrorism (START), localisé à l'université du Maryland.

Les données sont composées de 135 attributs difféerents décrivant pour chaque attaques terroristes le lieu, les moyens utilisés pour réalisé l'acte, le groupe terroriste ayant perpétré l'attaque, les populations visées ainsi que les résultats.

Les données sont utilisés dans le cadre des termes et conditions imposés par le START, à savoir : 

- Le jeu de données n'est pas utilisé à des fins commerciales, mais dans le cadre d'un projet universitaire de visualisation

- Il n'est pas non plus utilisé dans le cadre de réalisé une quelconque conclusion sur le status d'un criminel ou d'un groupe criminel

- N'interfère en aucun cas avec le site web du GTD

- Tout les membres ayant participés à l'élaboration de cette visualisation possède au moins 18 ans.


# Utilisateurs ciblés

# Objectifs de la visualisation

# Tâches analytiques

# Description du workflow de traitement de données

Le pré-traitement des données à été réalisé en Python à l'aide de la bibliothèque Pandas. Il est constitué de trois étapes : 

- La première consiste à récolter des statistiques globales sur les données afin de mieux comprendre les différents attributs et la qualité des données afin de choisir les plus pertinents pour la visualisation.

- La deuxième étape consiste à nettoyer les données en supprimant tout attributs inutiles pour la visualisation, ou possédant trop de valeurs manquantes.

- La troisième étape consiste à modifier le noms de certains lieux afin de pouvoir réaliser plus facilement la jointure avec la carte utliisée au sein de la visualisation. L'opréation à été réalisée sur les données plutôt que sur la carte afin de ne pas avoir à le faire une unique fois.

Les tâches de traitements des données, tels que le groupement de certaines catégories d'armes, ou de groupe terroristes sont réalisés lors de l'affichage des données, en javascript. Cela nous permet de réaliser des groupements dynamiques en s'adaptant aux statistiques de chaque pays, sans pour autant géner l'expérience de l'utilisateur sur le site. Les détails de ces traitements seront présentés dans la section dédiée à chaque composant de la visualisation.

# Description de la mise en page choisi ainsi que l'approche de synchronisation adoptée

Lors de l'arrivée de l'utilisateur sur la page, il est accueilli par une vue globale de la carte du monde, présentant le nombre total d'attaques terroristes par pays. Lors de la sélection d'au moins un pays, une barre d'affichage apparaît alors en bas de l'écran. Elle ce compose de trois composants principaux, décrivant : 
- La répartition du nombre d'attaques terroristes dans le temps pour le pays sélectionné.
- La présentation des types d'armes utilisées lors des attaques terroristes.
- La présentation de multiples données sous un format hiérarchique.

La mise en page à été pensée de manière à ce que l'utilisateur puisse se concentrer sur la carte du monde, et ainsi choisir les pays qu'il souhaite analyser. La barre d'affichage en bas de l'écran est discrète et n'empiète pas sur la vue principale, tout en étant facilement accessible pour l'utilisateur.

[Rajouter une partie sur la synchronisation et les filtres une fois fini]

# Techniques de visualisation et leurs interactions (sélections, filtres, etc.)

## Alex

## Marvin – Visualisation des Armes Utilisées

Le composant **Weapon Used** permet d'analyser la répartition des types d'armes employées lors des attaques terroristes. Ce composant adapte dynamiquement sa représentation visuelle en fonction du nombre de pays sélectionnés par l'utilisateur, offrant ainsi deux modes de visualisation complémentaires.

#### 1. Représentation pour un seul pays sélectionné

Lorsqu'un seul pays est sélectionné, les données sont présentées sous forme de **diagramme circulaire**. Cette visualisation met en évidence :

- La distribution proportionnelle des différents types d'armes utilisées
- Le pourcentage d'utilisation de chaque catégorie d'armes
- Une représentation intuitive des armes prédominantes dans le pays sélectionné

Pour maintenir une lisibilité optimale, seules les **8 principales catégories d'armes** sont affichées individuellement. Les armes moins fréquentes sont automatiquement regroupées dans une catégorie **Other**, permettant ainsi de concentrer l'analyse sur les tendances principales sans surcharger la visualisation.

#### 2. Représentation pour plusieurs pays sélectionnés

Lorsque plusieurs pays sont sélectionnés, le composant bascule automatiquement vers un **diagramme à barres empilées horizontales** (stacked bar chart). Ce mode de visualisation permet de :

- Comparer directement l'usage des armes entre différents pays
- Identifier les similitudes et différences dans les arsenaux utilisés
- Visualiser simultanément la proportion de chaque type d'arme par pays

Dans ce mode, seules les **4 catégories d'armes les plus utilisées globalement** sont représentées de manière distincte, les autres étant regroupées dans la catégorie **Other**. Cette approche facilite la comparaison inter-pays en se concentrant sur les armes les plus significatives statistiquement.

### Interactions et traitement des données

Le composant intègre plusieurs mécanismes pour optimiser l'expérience utilisateur :

- **Adaptation dynamique du graphique**  
  Le type de visualisation change automatiquement selon le nombre de pays sélectionnés, offrant toujours la représentation la plus pertinente pour l'analyse en cours.

- **Regroupement intelligent des données**  
  Un algorithme de regroupement dynamique identifie les catégories d'armes principales et agrège les moins fréquentes dans une catégorie « Other », évitant ainsi la fragmentation visuelle tout en préservant l'information globale.

- **Synchronisation avec les filtres**  
  Le composant est entièrement synchronisé avec le filtre temporel et la sélection de pays :
  - Les données affichées correspondent exactement à la plage temporelle sélectionnée
  - La mise à jour est instantanée lors de la sélection ou désélection d'un pays sur la carte
  
- **Informations détaillées au survol**  
  Un système de tooltips interactif affiche au survol des informations complémentaires telles que le nombre exact d'attaques, le nombre de victimes, et le taux de réussite des attaques pour chaque catégorie d'arme.

## Mateus – Diagramme Sunburst

Le diagramme **sunburst** constitue un élément central de la visualisation hiérarchique des données liées aux attaques terroristes. Il est conçu pour permettre une exploration intuitive des dynamiques d’attaque selon différents niveaux d’agrégation. Deux modes de représentation sont proposés selon le nombre de pays sélectionnés sur la carte :

#### 1. Représentation pour un seul pays sélectionné

Lorsque l’utilisateur sélectionne un seul pays, le sunburst affiche une hiérarchie en quatre niveaux :

- **Organisation attaquante**
- **Nombre de personnes impliquées dans l’attaque**
- **Groupe visé**
- **Succès ou échec de l’attaque**

Cette structure permet d’analyser les tendances propres à chaque organisation dans un pays donné, en mettant en lumière les cibles privilégiées, les modes opératoires et les taux de réussite.

#### 2. Représentation pour plusieurs pays sélectionnés

Lorsque plusieurs pays sont sélectionnés, le sunburst adopte une structure différente :

- **Pays**
- **Organisation attaquante**
- **Nombre de succès**

Ce mode permet de comparer les performances et les comportements des groupes terroristes dans différents contextes géographiques, en observant leur taux de réussite relatif.

---

### Interactions et filtres

Plusieurs interactions enrichissent l’expérience utilisateur :

- **Filtrage par pourcentage de groupes**  
  Un slider permet de définir le pourcentage de groupes terroristes à afficher dans le sunburst.  
  - Dans le premier mode (un seul pays), les groupes moins actifs sont simplement omis.  
  - Dans le second mode (plusieurs pays), ils sont regroupés dans une catégorie générique intitulée **« Autres »**.

- **Zoom interactif**  
  L’utilisateur peut cliquer sur n’importe quelle branche du sunburst pour zoomer et explorer uniquement cette branche et ses enfants, facilitant l’analyse ciblée.

- **Filtrage temporel**  
  Le diagramme est synchronisé avec le filtre temporel situé en haut de la page.  
  - Si une **plage d’années** est sélectionnée, le sunburst représente le **cumul des attaques** sur cette période.  
  - Si une **seule année** est sélectionnée, seules les attaques de cette année sont prises en compte.

## Erwan

# Sources 

National Consortium for the Study of Terrorism and Responses to Terrorism (START), University of Maryland. (2018). The Global Terrorism Database (GTD) [Data file]. Retrieved from https://www.start.umd.edu/gtd