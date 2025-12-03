import pandas as pd

# List of columns to be used in the analysis
columns = ["eventid", "iyear", "imonth", "iday", "extended", "country", "country_txt", "region", "region_txt", "provstate", "city", "latitude", "longitude", "multiple", "success", "suicide", "attacktype1_txt", "attacktype1", "targtype1", "targtype1_txt", "target1", "natlty1", "natlty1_txt", "gname", "nperps", "individual", "weaptype1", "weaptype1_txt", "weapsubtype1", "weapsubtype1_txt", "nkill", "nwound", "dbsource" ]

country_change = {
    "Dominican Republic": "Dominican Rep.",
    "United States": "United States of America",
    "Cyprus": "N. Cyprus",
    "Western Sahara": "W. Sahara",
    "Vatican City": "Vatican",
    "Central African Republic": "Central African Rep.",
    "Falkland Islands": "Falkland Is.",
    "Republic of the Congo": "Congo",
    "Ivory Coast": "Côte d'Ivoire",
    "Antigua and Barbuda": "Antigua and Barb.",
    "Bosnia-Herzegovina": "Bosnia and Herz.",
    "Equatorial Guinea": "Eq. Guinea",
    "Slovak Republic": "Slovakia",
    "Wallis and Futuna": "Wallis and Futuna Is.",
    "French Polynesia": "Fr. Polynesia",
    "Macau": "Macao",
    "Democratic Republic of the Congo": "Dem. Rep. Congo",
    "Solomon Islands": "Solomon Is.",
    "East Timor": "Timor leste",
    "St. Lucia": "Saint Lucia",
    "South Sudan": "S. Sudan"
}

df = pd.read_csv("globalterrorismdb_0718dist.csv", usecols=columns, encoding='latin1')
print(df.head())

# We only takes the columns
df_cleaned = df[columns]
df_cleaned['country_txt'] = df_cleaned['country_txt'].replace(country_change)
df_cleaned.to_csv("cleaned_data.csv", index=False)

# We check if the column as NaN values
nan_counts = df_cleaned.isna().sum()
print("NaN values in each column:")
print(nan_counts[nan_counts > 0])


