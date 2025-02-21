from rdkit import Chem
from rdkit.Chem import AllChem
from rdkit.Chem.rdmolfiles import MolToMolBlock

# Create a molecule (Example: Benzene)
mol = Chem.MolFromSmiles("CC(=O)Oc1ccccc1C(=O)O")  # Benzene
mol = Chem.AddHs(mol)  # Add Hydrogens
AllChem.EmbedMolecule(mol, AllChem.ETKDG())  # Generate 3D coordinates
AllChem.UFFOptimizeMolecule(mol)  # Optimize with force field

# Convert molecule to MOL format (contains explicit bond info)
mol_block = MolToMolBlock(mol)

# Save the molecule file
with open("molecule.mol", "w") as f:
    f.write(mol_block)

print("3D structure saved as 'molecule.mol'")
