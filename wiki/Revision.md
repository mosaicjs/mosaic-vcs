# Revision class

This class maps resource paths to the corresponding content revisions. In two 
project versions the same paths could correspond to different content revisions.  
And the same content (Blob) could corresponding to multiple resource paths. 
(For example - when there are two or more copies of the same content in 
different places.)

## Fields 

 * Path path  - resource path
 * Blob blob  - resource content 

## Table "vc_version_revisions"

Defines mapping between version, paths and content revisions.
 
* long versionId  - PK; reference to the "vc_version" table;
  (see the [Version class](Version.md))
* long pathId     - PK; reference to the "vc_path" table
* long revisionId - reference to the "vc_revisions" table

## Table "vc_path"

Defines individual paths and the corresponding identifiers. 

* long pathId     - PK unique path identifier  
* String path     - a unique full path
