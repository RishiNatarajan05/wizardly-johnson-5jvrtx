import pandas as pd
import numpy as np
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.neighbors import NearestNeighbors
import matplotlib.pyplot as plt
from itertools import chain

def load_and_preprocess_data(mentee_file, mentor_file):
    """Load mentee and mentor CSV data and preprocess columns."""
    print("\n[DEBUG] Loading data from files:", mentee_file, mentor_file)
    mentee_data = pd.read_csv(mentee_file)
    mentor_data = pd.read_csv(mentor_file)
    print(f"[DEBUG] Mentee records: {len(mentee_data)}, Mentor records: {len(mentor_data)}")

    # Fill any NaN values in language columns with empty strings
    mentee_data["Speaking Language"] = mentee_data["Speaking Language"].fillna("")
    mentor_data["speaking_language"] = mentor_data["speaking_language"].fillna("")

    # Process STEM Skills and Interests (assumes comma separated for skills/interests)
    print("[DEBUG] Processing STEM Skills and Interests")
    mentee_data['STEM Skills'] = mentee_data['STEM Skills'].apply(
        lambda x: str(x).split(', ') if isinstance(x, str) else [])
    mentor_data['stem_skills'] = mentor_data['stem_skills'].apply(
        lambda x: str(x).split(', ') if isinstance(x, str) else [])
    mentee_data['Interests'] = mentee_data['Interests'].apply(
        lambda x: str(x).split(', ') if isinstance(x, str) else [])
    mentor_data['interests'] = mentor_data['interests'].apply(
        lambda x: str(x).split(', ') if isinstance(x, str) else [])

    # Process Languages:
    # For mentees: "Speaking Language" may be separated by "/" so normalize and split.
    mentee_data['languages'] = mentee_data['Speaking Language'].apply(
        lambda x: [lang.strip().lower() for lang in (x.replace("/", ",") if isinstance(x, str) else "").split(",") if lang.strip()]
    )
    # For mentors, assume languages are space separated.
    mentor_data['languages'] = mentor_data['speaking_language'].apply(
        lambda x: [lang.strip().lower() for lang in str(x).split() if lang.strip()]
    )

    # Process Country: (convert to lower case)
    mentee_data['country_clean'] = mentee_data['Country'].apply(lambda x: str(x).lower().strip())
    mentor_data['country_clean'] = mentor_data['country'].apply(lambda x: str(x).lower().strip())

    print("[DEBUG] Preprocessing complete")
    print("[DEBUG] Mentee sample:\n", mentee_data.head(2))
    print("[DEBUG] Mentor sample:\n", mentor_data.head(2))
    return mentee_data, mentor_data

def create_feature_vectors(mentee_data, mentor_data):
    """
    Create feature vectors using the union of classes for skills, interests, and languages.
    Weight distribution:
      - STEM Skills:    20%
      - Interests:      7.5%
      - Field Match:    30%
      - Age:            10%
      - Languages:      17.5%
      - Country:        15%
    """
    print("\n[DEBUG] Creating feature vectors")
    # Ensure languages columns are lists (in case of missing or NaN values)
    mentee_data['languages'] = mentee_data['languages'].apply(lambda x: x if isinstance(x, list) else [])
    mentor_data['languages'] = mentor_data['languages'].apply(lambda x: x if isinstance(x, list) else [])
    
    mentee_data['STEM Skills'] = mentee_data['STEM Skills'].apply(lambda skills: [s.lower() for s in skills])
    mentor_data['stem_skills'] = mentor_data['stem_skills'].apply(lambda skills: [s.lower() for s in skills])
    mentee_data['Interests'] = mentee_data['Interests'].apply(lambda interests: [i.lower() for i in interests])
    mentor_data['interests'] = mentor_data['interests'].apply(lambda interests: [i.lower() for i in interests])
    
    all_skills = set(chain.from_iterable(mentee_data['STEM Skills'])) | set(chain.from_iterable(mentor_data['stem_skills']))
    all_interests = set(chain.from_iterable(mentee_data['Interests'])) | set(chain.from_iterable(mentor_data['interests']))
    all_languages = set(chain.from_iterable(mentee_data['languages'])) | set(chain.from_iterable(mentor_data['languages']))

    # Encode STEM Skills
    mlb_skills = MultiLabelBinarizer(classes=sorted(all_skills))
    mentee_skills = mlb_skills.fit_transform(mentee_data['STEM Skills'])
    mentor_skills = mlb_skills.transform(mentor_data['stem_skills'])
    print(f"[DEBUG] Skills dims - Mentees: {mentee_skills.shape}, Mentors: {mentor_skills.shape}")

    # Encode Interests
    mlb_interests = MultiLabelBinarizer(classes=sorted(all_interests))
    mentee_interests = mlb_interests.fit_transform(mentee_data['Interests'])
    mentor_interests = mlb_interests.transform(mentor_data['interests'])
    print(f"[DEBUG] Interests dims - Mentees: {mentee_interests.shape}, Mentors: {mentor_interests.shape}")

    # Encode Fields using pd.get_dummies
    print("[DEBUG] Encoding Fields")
    mentee_fields = pd.get_dummies(mentee_data['Desired Field'])
    mentor_fields = pd.get_dummies(mentor_data['field'])
    all_fields = list(set(mentee_fields.columns) | set(mentor_fields.columns))
    for col in all_fields:
        if col not in mentee_fields.columns:
            mentee_fields[col] = 0
            print(f"[DEBUG] Added missing field '{col}' to mentee fields")
        if col not in mentor_fields.columns:
            mentor_fields[col] = 0
            print(f"[DEBUG] Added missing field '{col}' to mentor fields")
    mentee_fields = mentee_fields[all_fields]
    mentor_fields = mentor_fields[all_fields]
    print(f"[DEBUG] Field dims - Mentees: {mentee_fields.shape}, Mentors: {mentor_fields.shape}")

    # Normalize Age
    mentee_age = mentee_data[['Age']].values / 100.0
    mentor_age = mentor_data[['age']].values / 100.0

    # Encode Languages
    print("[DEBUG] Encoding Languages")
    mlb_languages = MultiLabelBinarizer(classes=sorted(all_languages))
    mentee_languages = mlb_languages.fit_transform(mentee_data['languages'])
    mentor_languages = mlb_languages.transform(mentor_data['languages'])
    print(f"[DEBUG] Languages dims - Mentees: {mentee_languages.shape}, Mentors: {mentor_languages.shape}")

    # Encode Country
    print("[DEBUG] Encoding Country")
    mentee_country = pd.get_dummies(mentee_data['country_clean'])
    mentor_country = pd.get_dummies(mentor_data['country_clean'])
    all_countries = list(set(mentee_country.columns) | set(mentor_country.columns))
    for col in all_countries:
        if col not in mentee_country.columns:
            mentee_country[col] = 0
            print(f"[DEBUG] Added missing country '{col}' to mentee country")
        if col not in mentor_country.columns:
            mentor_country[col] = 0
            print(f"[DEBUG] Added missing country '{col}' to mentor country")
    mentee_country = mentee_country[all_countries]
    mentor_country = mentor_country[all_countries]
    print(f"[DEBUG] Country dims - Mentees: {mentee_country.shape}, Mentors: {mentor_country.shape}")

    print("[DEBUG] Combining features with new weights")
    mentee_features = np.hstack([
        mentee_skills * 0.20,
        mentee_interests * 0.075,
        mentee_fields.values * 0.30,
        mentee_age * 0.10,
        mentee_languages * 0.175,
        mentee_country.values * 0.15
    ])
    mentor_features = np.hstack([
        mentor_skills * 0.20,
        mentor_interests * 0.075,
        mentor_fields.values * 0.30,
        mentor_age * 0.10,
        mentor_languages * 0.175,
        mentor_country.values * 0.15
    ])
    print(f"[DEBUG] Final feature dimensions - Mentees: {mentee_features.shape}, Mentors: {mentor_features.shape}")
    return mentee_features, mentor_features

def build_knn_model(mentor_features, n_neighbors=5):
    """Build a KNN model based on mentor features."""
    print(f"\n[DEBUG] Building KNN model with n_neighbors={n_neighbors}")
    actual_neighbors = min(n_neighbors, mentor_features.shape[0])
    if actual_neighbors < n_neighbors:
        print(f"[DEBUG] Adjusted n_neighbors to {actual_neighbors} due to mentor data size")
    knn = NearestNeighbors(n_neighbors=actual_neighbors, metric='euclidean')
    knn.fit(mentor_features)
    print("[DEBUG] KNN model built successfully")
    return knn

def find_mentors_for_mentee(mentee_idx, mentee_features, knn_model, mentor_data, mentee_data, k=5):
    """Find matching mentors for a given mentee index and display mentee stats."""
    mentee_record = mentee_data.iloc[mentee_idx]
    print(f"\n[DEBUG] Mentee Profile for index {mentee_idx}:")
    print(f"Name: {mentee_record['Name']}")
    print(f"Desired Field: {mentee_record['Desired Field']}")
    print(f"STEM Skills: {', '.join(mentee_record['STEM Skills'])}")
    print(f"Interests: {', '.join(mentee_record['Interests'])}")
    print(f"Languages: {', '.join(mentee_record['languages'])}")
    print(f"Country: {mentee_record['country_clean']}")
    print(f"Age: {mentee_record['Age']}")

    print(f"\n[DEBUG] Finding mentors for mentee index {mentee_idx}")
    mentee_vector = mentee_features[mentee_idx].reshape(1, -1)
    distances, indices = knn_model.kneighbors(mentee_vector)
    print(f"[DEBUG] Distances: {distances[0]}\n[DEBUG] Mentor indices: {indices[0]}")
    match_scores = 100 * (1.0 / (1.0 + distances[0]))

    matched_mentors = []
    for idx, score in zip(indices[0], match_scores):
        mentor = mentor_data.iloc[idx]
        print(f"[DEBUG] Processing mentor: {mentor['name']} with score {score:.1f}%")
        matched_mentors.append({
            'name': mentor['name'],
            'field': mentor['field'],
            'skills': mentor['stem_skills'],
            'interests': mentor['interests'],
            'experience': mentor['work_experience'],
            'match_score': score,
            'languages': mentor['languages'],
            'country': mentor['country']
        })
    print(f"[DEBUG] Found {len(matched_mentors)} mentor matches")
    return matched_mentors

def visualize_matches(mentee_name, matched_mentors, save_path=None):
    """Create a bar chart visualization for mentor matches."""
    print(f"\n[DEBUG] Visualizing matches for {mentee_name}")
    names = [m['name'] for m in matched_mentors]
    scores = [m['match_score'] for m in matched_mentors]
    plt.figure(figsize=(12, 6))
    plt.barh(range(len(names)), scores, color='skyblue')
    plt.yticks(range(len(names)), names)
    plt.xlabel('Match Score (%)')
    plt.title(f'Top Mentor Matches for {mentee_name}')
    for i, score in enumerate(scores):
        plt.text(score + 1, i, f'{score:.1f}%', va='center')
    plt.tight_layout()
    if save_path:
        plt.savefig(save_path)
        print(f"[DEBUG] Visualization saved to {save_path}")
    else:
        print("[DEBUG] Save path not provided; visualization not saved")
    plt.close()

def mentor_matching_application():
    """Main interactive mentor-mentee matching application."""
    print("\n=== Enhanced Mentor-Mentee Matching System ===\n")
    mentee_file = 'menteedataconvergent.csv'
    mentor_file = 'mentordataconvergent.csv'
    mentee_data, mentor_data = load_and_preprocess_data(mentee_file, mentor_file)
    mentee_features, mentor_features = create_feature_vectors(mentee_data, mentor_data)
    knn_model = build_knn_model(mentor_features)

    while True:
        print("\nOptions:")
        print("1. Find mentors for an existing mentee")
        print("2. Create and match a new mentee")
        print("3. List all mentees")
        print("4. Create a new mentor")
        print("5. Exit")
        choice = input("\nEnter your choice (1-5): ").strip()
        print(f"[DEBUG] Option selected: {choice}")

        if choice == '1':
            print("[DEBUG] Option 1 selected: Match an existing mentee")
            print("\nSelect a mentee:")
            for i, (_, mentee) in enumerate(mentee_data.iterrows()):
                print(f"{i+1}. {mentee['Name']} - {mentee['Desired Field']}")
            try:
                idx = int(input("\nEnter mentee number: ")) - 1
                if 0 <= idx < len(mentee_data):
                    mentee_name = mentee_data.iloc[idx]['Name']
                    matched = find_mentors_for_mentee(idx, mentee_features, knn_model, mentor_data, mentee_data, k=5)
                    print(f"\nTop Mentor Matches for {mentee_name}:")
                    for j, mentor in enumerate(matched):
                        print(f"{j+1}. Name: {mentor['name']} (Score: {mentor['match_score']:.1f}%)")
                        print(f"   Field: {mentor['field']}")
                        print(f"   Skills: {', '.join(mentor['skills'])}")
                        print(f"   Interests: {', '.join(mentor['interests'])}")
                        print(f"   Experience: {mentor['experience']}")
                        print(f"   Languages: {', '.join(mentor['languages'])}")
                        print(f"   Country: {mentor['country']}\n")
                    vis_path = f"{mentee_name.replace(' ', '_')}_matches.png"
                    visualize_matches(mentee_name, matched, save_path=vis_path)
                    print(f"Visualization saved as {vis_path}")
                    detail = input("Enter mentor number for more details (or press Enter to skip): ").strip()
                    if detail.isdigit():
                        detail_idx = int(detail) - 1
                        if 0 <= detail_idx < len(matched):
                            mentor = matched[detail_idx]
                            print(f"\nDetailed information for {mentor['name']}:")
                            for key, value in mentor.items():
                                if key not in ['name']:
                                    if isinstance(value, list):
                                        print(f"{key.capitalize()}: {', '.join(value)}")
                                    else:
                                        print(f"{key.capitalize()}: {value}")
                        else:
                            print("[DEBUG] Invalid mentor selection")
                    else:
                        print("[DEBUG] Skipping detailed mentor view")
                else:
                    print("[DEBUG] Mentee selection out of range")
            except ValueError:
                print("[DEBUG] Invalid input; expecting a number")
        elif choice == '2':
            print("[DEBUG] Option 2 selected: Create a new mentee")
            name = input("Enter mentee name: ").strip()
            country = input("Enter mentee country: ").strip().lower()
            speaking_lang = input("Enter speaking languages (comma or slash separated): ").strip()
            
            available_fields = list(mentor_data['field'].unique())
            print("\nAvailable Fields:")
            for i, field in enumerate(available_fields):
                print(f"{i+1}. {field}")
            try:
                field_idx = int(input("Select desired field (number): ").strip()) - 1
                desired_field = available_fields[field_idx] if 0 <= field_idx < len(available_fields) else "General"
            except ValueError:
                desired_field = "General"
                
            degree = input("Enter degree (e.g., Bachelor's, Master's): ").strip()
            college = input("Enter college/university: ").strip()
            
            print("Enter STEM skills (comma separated):")
            skills = [s.strip() for s in input().split(',') if s.strip()]
            
            print("Enter Interests (comma separated):")
            interests = [s.strip() for s in input().split(',') if s.strip()]
            
            prior_exp = input("Enter prior work experience: ").strip()
            
            try:
                age = int(input("Enter mentee age: ").strip())
            except ValueError:
                print("[DEBUG] Age input invalid")
                continue
                
            # Process languages from input: for mentees, we split on comma or slash
            languages = [lang.strip().lower() for lang in 
                         speaking_lang.replace("/", ",").split(",") if lang.strip()]
            
            # Create the new mentee row with all required columns
            new_row = pd.DataFrame({
                'Name': [name],
                'Country': [country],
                'Speaking Language': [speaking_lang],
                'Desired Field': [desired_field],
                'Degree': [degree],
                'College': [college],
                'STEM Skills': [skills],
                'Interests': [interests],
                'Prior Work Experience': [prior_exp],
                'Age': [age],
                'languages': [languages],
                'country_clean': [country]
            })
            
            old_count = len(mentee_data)
            mentee_data = pd.concat([mentee_data, new_row], ignore_index=True)
            print(f"[DEBUG] Mentee data updated from {old_count} to {len(mentee_data)} rows")
            # Save updated mentee CSV
            mentee_data.to_csv(mentee_file, index=False)
            # Recompute feature vectors and rebuild KNN model
            mentee_features, mentor_features = create_feature_vectors(mentee_data, mentor_data)
            knn_model = build_knn_model(mentor_features)
            
            new_idx = len(mentee_data) - 1
            matched = find_mentors_for_mentee(new_idx, mentee_features, knn_model, mentor_data, mentee_data, k=5)
            print(f"\nTop Mentor Matches for new mentee {name}:")
            for j, mentor in enumerate(matched):
                print(f"{j+1}. Name: {mentor['name']} (Score: {mentor['match_score']:.1f}%)")
                print(f"   Field: {mentor['field']}")
                print(f"   Skills: {', '.join(mentor['skills'])}")
                print(f"   Interests: {', '.join(mentor['interests'])}")
                print(f"   Experience: {mentor['experience']}")
                print(f"   Languages: {', '.join(mentor['languages'])}")
                print(f"   Country: {mentor['country']}\n")
            vis_path = f"{name.replace(' ', '_')}_matches.png"
            visualize_matches(name, matched, save_path=vis_path)
            print(f"Visualization saved as {vis_path}")
            
        elif choice == '3':
            print("[DEBUG] Option 3 selected: List all mentees")
            print("\nMentee List:")
            for i, (_, mentee) in enumerate(mentee_data.iterrows()):
                print(f"{i+1}. {mentee['Name']} - {mentee['Desired Field']}")
                
        elif choice == '4':
            print("[DEBUG] Option 4 selected: Create a new mentor")
            m_name = input("Enter mentor name: ").strip()
            m_country = input("Enter mentor country: ").strip().lower()
            m_lang = input("Enter speaking languages (space separated): ").strip()
            m_field = input("Enter mentor field: ").strip()
            m_degree = input("Enter mentor degree: ").strip()
            m_college = input("Enter mentor college: ").strip()
            
            print("Enter STEM skills (comma separated):")
            m_skills = [s.strip() for s in input().split(',') if s.strip()]
            
            print("Enter Interests (comma separated):")
            m_interests = [s.strip() for s in input().split(',') if s.strip()]
            
            m_experience = input("Enter work experience: ").strip()
            
            try:
                m_age = int(input("Enter mentor age: ").strip())
            except ValueError:
                print("[DEBUG] Invalid age input, mentor not added")
                continue

            # Process languages from input: for mentors, we split on whitespace
            m_languages = [lang.strip().lower() for lang in m_lang.split() if lang.strip()]
            
            # Create new mentor row with all required columns
            new_m_row = pd.DataFrame({
                'name': [m_name],
                'country': [m_country],
                'speaking_language': [m_lang],
                'field': [m_field],
                'degree': [m_degree],
                'college': [m_college],
                'stem_skills': [m_skills],
                'interests': [m_interests],
                'work_experience': [m_experience],
                'age': [m_age],
                'languages': [m_languages],
                'country_clean': [m_country]
            })
            
            old_m_count = len(mentor_data)
            mentor_data = pd.concat([mentor_data, new_m_row], ignore_index=True)
            print(f"[DEBUG] Mentor data updated from {old_m_count} to {len(mentor_data)} rows")
            # Save updated mentor CSV
            mentor_data.to_csv(mentor_file, index=False)
            # Recompute feature vectors and rebuild KNN model
            mentee_features, mentor_features = create_feature_vectors(mentee_data, mentor_data)
            knn_model = build_knn_model(mentor_features)
            print("[DEBUG] New mentor added successfully")
            
        elif choice == '5':
            print("[DEBUG] Exiting application")
            break
        else:
            print("[DEBUG] Invalid option selected. Please choose 1-5.")

if __name__ == "__main__":
    print("[DEBUG] Enhanced mentor matching script started")
    mentor_matching_application()
    print("[DEBUG] Script ended")