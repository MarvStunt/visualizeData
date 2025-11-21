import pandas as pd

# List of columns to be used in the analysis
columns = ["eventid", "iyear", "imonth", "iday", "extended", "country", "country_txt", "region", "region_txt", "provstate", "city", "latitude", "longitude", "multiple", "success", "suicide", "attacktype1_txt", "attacktype1", "targtype1", "targtype1_txt", "target1", "natlty1", "natlty1_txt", "gname", "nperps", "individual", "weaptype1", "weaptype1_txt", "weapsubtype1", "weapsubtype1_txt", "nkill", "nwound", "dbsource" ]

df = pd.read_csv("globalterrorismdb_0718dist.csv", usecols=columns, encoding='latin1')
print(df.head())

# We only takes the columns
df_cleaned = df[columns]
df_cleaned.to_csv("cleaned_data.csv", index=False)

# We check if the column as NaN values
nan_counts = df_cleaned.isna().sum()
print("NaN values in each column:")
print(nan_counts[nan_counts > 0])