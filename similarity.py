from sentence_transformers import SentenceTransformer, util
import csv
import sys
import re
import copy
import numpy as np
from numpy import dot
from numpy.linalg import norm
import pickle

model = SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')

directory = ''
if (len(sys.argv) > 2):
    directory = sys.argv [2]

#from spellchecker import SpellChecker
#french = SpellChecker(language='fr')

def replaceSpecial (query):
    query = query.lower ()
    query = query.replace ('"', ' ')
    query = query.replace ("'", " ")
    query = query.replace ("’", " ")
    query = query.replace ("?", " ")
    query = query.replace (":", " ")
    query = query.replace (";", " ")
    #query = query.replace (".", " ")
    #query = query.replace (",", " ")
    query = query.replace ("é", "e")
    query = query.replace ("è", "e")
    query = query.replace ("à", "a")
    query = query.replace ("û", "u")

    if len (query) > 0:
        while query [0] == ' ':
            query = query [1:]
        while query [-1] == ' ':
            query = query [:-1]

    #end = len (query) - 1
    #for i in range (len (query)):
    #    if query [i] == ' ':
    #        end = i - 1
    #        break

    #if end < len (query) and end > -1:
    #    if query [end] == 's':
    #        query = query [:end] + query [end +1:]
        
    return query

def load (csv):
    mat = []
    with open(csv, 'r', encoding="utf-8") as file:
        i = 0
        for row in file:
            result = []
            last = 0
            for j in range (len (row)):
                if row [j] == ';':
                    if last == j:
                        result.append ('')
                    else:
                        result.append (row [last:j])
                    last = j + 1
                if j == len (row) - 1:
                    result.append (row [last:j])
            if result == []:
                break
            mat.append (result)
    return mat

#questions = load ('similarity.csv')
#reponses = load ('reponses.csv')
questions = load (directory + 'questions.csv')

print (len (questions), 'questions.')
#print (len (reponses), 'réponses.')

with open(directory + 'MotsCles.csv', 'r', encoding="utf-8") as file:
    i = 0
    labels = []
    rows = []
    for row in file:
        #if i == 0:
        #    print (row)
        result = []
        last = 0
        for j in range (len (row)):
            #print (row [i])
            if row [j] == ';':
                #print (i)
                if last == j:
                    result.append ('')
                else:
                    s = replaceSpecial(row [last:j])
                    result.append (s)
                last = j + 1
            if j == len (row) - 1:
                s = replaceSpecial(row [last:j])
                result.append (s)
        if result == []:
            break
        if i == 0:
            for string in result:
                #s = re.sub(r'[\W_]', '', string)
                #s = s.replace(" ","")
                #s = s.lower ()
                #labels.append (s)
                labels.append (replaceSpecial(string))
        else:
            rows.append (result)
        i = i + 1

#print (labels)
#print (rows [0])

synonymes = []
#with open('Synonymes.csv', 'r') as file:
with open(directory + 'Synonymes.csv', 'r', encoding="utf-8") as file:
    i = 0
    for row in file:
        result = []
        last = 0
        for j in range (len (row)):
            #print (row [i])
            if row [j] == ';':
                #print (i)
                if last == j:
                    result.append ('')
                else:
                    result.append (replaceSpecial(row [last:j]))
                last = j + 1
            if j == len (row) - 1:
                result.append (replaceSpecial(row [last:j]))
        if result == []:
            break
        if i == 0:
            for w in range(len(result)):
                if result [w] != '':
                    synonymes.append ([result [w]])
        else:
            for w in range(len(result)):
                if result [w] != '':
                    #print (i, w, synonymes [w], result [w])
                    if len (result [w]) > 0:
                        synonymes [w].append (result [w])
                        if result [w] [-1] == 's':
                            synonymes [w].append (result [w] [:-1])
        i = i + 1

#print (synonymes)

def getSynonymes (query):
    l = [query]
    for i in range (len (synonymes)):
        for j in range (len (synonymes [i])):
            if query [:len (synonymes [i] [j])].lower () == synonymes [i] [j].lower ():
                l = l + synonymes [i]
    return l

def levenshteinDistance (s1, s2):
    if len(s1) > len(s2):
        s1, s2 = s2, s1

    distances = range(len(s1) + 1)
    for i2, c2 in enumerate(s2):
        distances_ = [i2+1]
        for i1, c1 in enumerate(s1):
            if c1 == c2:
                distances_.append(distances[i1])
            else:
                distances_.append(1 + min((distances[i1], distances[i1 + 1], distances_[-1])))
        distances = distances_
    return distances[-1]

def loadFEC (csv):
    global labelsFEC, rowsFEC, Fournisseurs
    labelsFEC = []
    rowsFEC = []
    Fournisseurs = []
    indexFournisseurs = 7
    #with open(csv, 'r') as file:
    with open(csv, 'r', encoding="utf-8") as file:
        i = 0
        for row in file:
            #if i == 0:
            #    print (row)
            result = []
            last = 0
            for j in range (len (row)):
                if row [j] == ';':
                    if last == j:
                        result.append ('')
                    else:
                        result.append (replaceSpecial(row [last:j]))
                    last = j + 1
                if j == len (row) - 1:
                    result.append (replaceSpecial(row [last:j]))
            if result == []:
                break
            if i == 0:
                for string in result:
                    #s = re.sub(r'[\W_]', '', string)
                    #s = s.replace(" ","")
                    #s = s.lower ()
                    #labels.append (s)
                    labelsFEC.append (replaceSpecial(string))
                    if string.find ('CompAuxLib') != -1:
                        indexFournisseurs = len (labelsFEC) - 1
            else:
                rowsFEC.append (result)
                if result [indexFournisseurs] != '':
                    f = result [indexFournisseurs]
                    if not f in Fournisseurs:
                        Fournisseurs.append (f)
            i = i + 1
    print (Fournisseurs)

if (len(sys.argv) > 1):
    loadFEC (directory + sys.argv [1])
else:
    loadFEC (directory + 'FEC-Restau.csv')

debug = False

mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

def MotsCles (query):
    xxx = []
    mmm = []
    fff = []
    q = replaceSpecial (query)
    for i in range (len (q)):
        startWord = False
        if i == 0:
            startWord = True
        elif q [i - 1] == ' ':
            startWord = True
        if startWord:
            bestLength = 0
            w = q [i:]
            listeSynonymes = getSynonymes (w)
            print ('listeSynonymes', listeSynonymes)
            for m in mois:
                mm = replaceSpecial (m)
                if len (w) >= len (mm):
                    if w [:len (mm)] == mm:
                        mmm.append (mm)
                        if debug:
                            print (mm)
            for f in Fournisseurs:
                ff = replaceSpecial (f)
                if len (w) >= len (ff):
                    if w [:len (ff)] == ff:
                        fff.append (ff)
                        if debug:
                            print (ff)
            for lab in range (len (labels)):
                for row in range (len (rows)):
                    if len (rows [row] [lab]) > 0:
                        for w in listeSynonymes:
                            if len (w) >= len (rows [row] [lab]):
                                # tester avec distance d'edition <= 2 pour fautes de frappes et chiffre d'affaire
                                #if w [:len (rows [row] [lab])].lower () == rows [row] [lab].lower ():
                                if len (rows [row] [lab]) > 2: 
                                    if levenshteinDistance (w [:len (rows [row] [lab])], rows [row] [lab]) < 2: 
                                        #if debug:
                                        print ('Mot cle possible', rows [row] [lab])
                                        if len (rows [row] [lab]) > bestLength:
                                            bestLength = len (rows [row] [lab])
                                            mot = rows [row] [lab]
            if bestLength > 0:
                xxx.append (mot)
                if debug:
                    print (mot)
    return xxx,mmm,fff

def replaceMotsCles (q, xxx, mmm, fff):
    for j in range (len (xxx)):
        m = 'xxx' + str (j + 1)
        #m = 'xxx'
        q = q.replace (m, xxx [j])
    for j in range (len (mmm)):
        m = 'mmm' + str (j + 1)
        #m = 'mmm'
        q = q.replace (m, mmm [j])
    for j in range (len (fff)):
        m = 'fff' + str (j + 1)
        #m = 'fff'
        q = q.replace (m, fff [j])
    return q

def indexEmbedding (query, xxx, mmm, fff):
    best = -1.0
    besti = -1
    bestq = ''
    q = replaceSpecial (query)
    embedding2 = model.encode(q)
    for i in range (3, len (questions)):
        q = replaceSpecial (questions [i] [0])
        if len (q) > 3:
            q = replaceMotsCles (q, xxx, mmm, fff)
            if q.find ('xxx') != -1:
                continue
            if q.find ('yyy') != -1:
                continue
            if q.find ('fff') != -1:
                continue
            if q.find ('mmm') != -1:
                continue
            embedding1 = model.encode (q)
            sim = dot (embedding1, embedding2) / (norm(embedding1) * norm(embedding2))
            print (q, sim)
            if sim > best:
                best = sim
                besti = i
                bestq = q
    return besti,best,bestq

def similarity (q1, q2):
    embedding1 = model.encode(q1)
    embedding2 = model.encode(q2)
    sim = dot (embedding1, embedding2) / (norm(embedding1) * norm(embedding2))
    return sim

while (True):
    query = input ('')
    if query == 'quit':
        break

    if len (query) > 4:
        if query [-4:] == '.csv':
            print ('loading FEC ' + directory + query)
            loadFEC (directory + query)
            continue
    '''
    words = query.split ()
    # find those words that may be misspelled
    misspelled = french.unknown(words)

    for word in misspelled:
        # Get the one `most likely` answer
        correction = french.correction(word)
        print(word, '->', correction)
        query.replace (word, correction)
    '''
    
    xxx,mmm,fff = MotsCles (query)
    print (xxx, mmm, fff)
    besti,best,bestq = indexEmbedding (query, xxx, mmm, fff)
    print ('besti', besti)
    if besti == -1:
        print ("Je n'ai pas trouvé la question dans similarity.csv")
        continue
    q = replaceMotsCles (questions [besti] [1], xxx, mmm, fff)
    print ('Question =', bestq, best, 'Question reformatée =', q)
    #reponsei = -1
    #for i in range (3, len (reponses)):
    #    if reponses [i] [0] == questions [besti] [1]:
    #        reponsei = i
    #if reponsei == -1:
    #    print ("Je n'ai pas trouvé la question reformatée dans reponses.csv")
    #    continue
    #for i in range (1, len(reponses [reponsei])):
    #    q = replaceMotsCles (reponses [reponsei] [i], xxx, mmm, fff)
    #    sys.stdout.write (q)
    #sys.stdout.write ('\n')
    for i in range (2, len(questions [besti])):
        q = replaceMotsCles (questions [besti] [i], xxx, mmm, fff)
        sys.stdout.write (q)
    sys.stdout.write ('\n')
