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

## Marvin

## Mateus

## Erwan

# Sources 

National Consortium for the Study of Terrorism and Responses to Terrorism (START), University of Maryland. (2018). The Global Terrorism Database (GTD) [Data file]. Retrieved from https://www.start.umd.edu/gtd