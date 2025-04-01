import pandas as pd
import numpy as np
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.neighbors import NearestNeighbors
import matplotlib.pyplot as plt
from itertools import chain
from supabase import create_client, Client
import os
from io import BytesIO
import base64

# Supabase client setup
url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

def load_from_database():
    """Load mentee and mentor data from Supabase."""
    print("\n[DEBUG] Loading data from Supabase")
    
    # Get mentees
    response = supabase.table("mentees").select("*").execute()
    mentee_data = pd.DataFrame(response.data)
    
    # Get mentors
    response = supabase.table("mentors").select("*").execute()
    mentor_data = pd.DataFrame(response.data)
    
    print(f"[DEBUG] Mentee records: {len(mentee_data)}, Mentor records: {len(mentor_data)}")
    
    # Make sure arrays are properly handled
    # The rest of the preprocessing remains similar to your original function
    # ...

    return mentee_data, mentor_data

def save_match_to_database(mentee_id, mentor_matches):
    """Save match results to the database."""
    print(f"\n[DEBUG] Saving matches for mentee {mentee_id}")
    
    for match in mentor_matches:
        # Insert into matches table
        data = {
            "mentee_id": mentee_id,
            "mentor_id": match['id'],  # Assuming you added mentor ID to the match dict
            "match_score": float(match['match_score']),
            "status": "pending"
        }
        
        response = supabase.table("matches").insert(data).execute()
        print(f"[DEBUG] Match saved: {response.data}")

def find_mentors_for_mentee_api(mentee_id):
    """API-friendly version that returns JSON data."""
    mentee_data, mentor_data = load_from_database()
    mentee_features, mentor_features = create_feature_vectors(mentee_data, mentor_data)
    knn_model = build_knn_model(mentor_features)
    
    # Find mentee index by ID
    mentee_idx = mentee_data[mentee_data['id'] == mentee_id].index[0]
    
    matched_mentors = find_mentors_for_mentee(
        mentee_idx, mentee_features, knn_model, mentor_data, mentee_data
    )
    
    # Create visualization and convert to base64 for embedding
    buffer = BytesIO()
    visualize_matches(mentee_data.iloc[mentee_idx]['name'], matched_mentors, save_buffer=buffer)
    image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
    
    # Save matches to database
    save_match_to_database(mentee_id, matched_mentors)
    
    return {
        "mentee": mentee_data.iloc[mentee_idx].to_dict(),
        "matches": matched_mentors,
        "visualization": image_base64
    }

# Update the visualization function to support in-memory buffers
def visualize_matches(mentee_name, matched_mentors, save_path=None, save_buffer=None):
    """Create a bar chart visualization for mentor matches."""
    print(f"\n[DEBUG] Visualizing matches for {mentee_name}")
    # Same visualization code as before
    # ...
    
    if save_buffer:
        plt.savefig(save_buffer, format='png')
        print(f"[DEBUG] Visualization saved to buffer")
    elif save_path:
        plt.savefig(save_path)
        print(f"[DEBUG] Visualization saved to {save_path}")
    plt.close()